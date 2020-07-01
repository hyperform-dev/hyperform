const express = require('express');
const { Cloudkernel } = require('../../ck/index')

const router = express.Router();

const clk = new Cloudkernel([{ run: 'myinc' }])
/* GET home page. */
router.get('/', async (req, resp, next) => {
  clk.run({ num: Math.ceil(Math.random() * 100) })
    .then((result) => resp.json(result))
});

module.exports = router;
