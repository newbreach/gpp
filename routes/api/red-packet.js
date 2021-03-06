var express = require('express');
var router = express.Router();
var redPacketService = require('../../services/red-packet');

/**
 * 创建红包发放计划
 */
router.post('/create_active', function (req, res, next) {
    redPacketService.createRedPacketActive(req.body, req.token.user_id, (err, result) => {
        if (err) {
            return next(err);
        }
        res.send(JSON.stringify({ code: 1000 }));
    });
});
/**
 * 获取红包活动
 */
router.post('/get_actives', function (req, res, next) {
    redPacketService.activesList(req.body, req.token.user_id, (err, result) => {
        if (err) {
            return next(err);
        }
        res.send(JSON.stringify({ code: 1000, data: result }));
    });
});

/**
 * 获取红包卡详情列表
 */
router.post('/load_cards', function (req, res, next) {
    redPacketService.loadCards(req.body, (err, result) => {
        if (err) {
            return next(err);
        }
        res.send(JSON.stringify({ code: 1000, data: result }));
    });
});

/**
 * 生成红包卡
 */
router.post('/generate_cards', function (req, res, next) {
    redPacketService.generateRedPacketCards(req.body, req.token.user_id, (err, result) => {
        if (err) {
            return next(err);
        }
        res.send(JSON.stringify({ code: 1000 }));
    });
});
module.exports = router;