import express from 'express'
import { registerNewUser } from '../controllers/index.ts'

const router = express.Router()

router.post('/register', function (req, res) {
  return registerNewUser(req, res)
})

export default router
