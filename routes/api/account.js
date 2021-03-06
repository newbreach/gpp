var express = require('express');
var router = express.Router();
var async = require('async');
var accountService = require('../../services/account');
var couponService = require('../../services/coupon');
var weixinService = require('../../services/weixin');
var util = require('../../utils/index');

//加载账户数据
router.post('/load', function (req, res, next) {
  let user_id = req.token.user_id;
  accountService.loadAccount(user_id, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(JSON.stringify({ code: 1000, data: result }));
  });
});

/**
 * 获取客户可用的优惠券
 */
router.post('/get_coupons', function (req, res, next) {
  let user_id = req.token.user_id;
  couponService.getCouponsWithUser(user_id, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(JSON.stringify({ code: 1000, data: result }));
  });
});

/**
* 优惠券充值
* 1.查询优惠券合法性
* 2.入账
*/
router.post('/coupon_recharge', function (req, res, next) {
  let { code } = req.body,
    user_id = req.token.user_id,
    ip = util.getClientIp(req),
    money = 0,
    tradeNo = undefined;
  async.waterfall([
    (cb) => {
      couponService.useCoupon(code, user_id, (err, trade_no, m) => {
        tradeNo = trade_no;
        money = m;
        cb(err, trade_no);
      });
    },
    (tradeNo, cb) => {
      accountService.confirmInAccount(tradeNo, cb);
    }
  ], (err) => {
    if (err) {
      next(err);
    } else {
      console.log(`优惠券入账成功! 单号:${tradeNo}, 金额:${money}`);
      res.send(JSON.stringify({ code: 1000, data: { money, tradeNo } }));
    }
  });
});



/**
 * 微信充值
 * 1.创建充值记录
 * 2.创建预定单
 */
router.post('/weixin_recharge', function (req, res, next) {
  let { money } = req.body;
  let user_id = req.token.user_id;
  let ip = util.getClientIp(req);
  let trade_no = weixinService.generateTradeNo();
  let code_url = undefined;
  async.waterfall([
    (cb) => {
      weixinService.wxOrderCreate(trade_no, Math.floor(money * 100), ip, cb);
    },
    (xmlobj, cb) => {
      code_url = xmlobj.code_url._cdata;
      accountService.createRecharge(trade_no, 0, money, user_id, xmlobj, cb);
    }
  ], (err) => {
    if (err) {
      next(err);
    } else {
      res.send(JSON.stringify({ code: 1000, data: { code_url, trade_no } }));
    }
  });
});

/**
 * 微信充值状态查询
 */
router.post('/weixin_recharge_query', function (req, res, next) {
  let { trade_no } = req.body;
  weixinService.wxOrderQuery(trade_no, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(JSON.stringify({ code: 1000, data: { trade_state: result.trade_state._cdata } }));
  });
});

/**
 * 充值历史查询
 */
router.post('/recharge_history', function (req, res, next) {
  let { status, type, start_time, end_time, page_index, page_size } = req.body;
  let user_id = req.token.user_id;
  accountService.searchRecharge(status, type, user_id, start_time, end_time, page_index, page_size, (err, results) => {
    if (err) {
      return next(err);
    }
    res.send(JSON.stringify({ code: 1000, data: { rows: results[0], total_count: results[1][0]['total'] } }));
  });
});

/**
 * 加载充值记录
 */
router.post('/recharge_load', function (req, res, next) {
  let { id } = req.body;
  accountService.loadRecharge(id, (err, result) => {
    if (err) {
      return next(err);
    }
    res.send(JSON.stringify({ code: 10000, data: result }));
  });
});

module.exports = router;