import express from 'express'
import type { Request, Response } from 'express'
const router = express.Router()

/* GET home page. */
router.get('/', function (req: Request, res: Response) {
  res.send('Welcome to my project!')
})

export default router
