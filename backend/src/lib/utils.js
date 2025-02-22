import jwt from 'jsonwebtoken'

export const generateToken = (userId, res) => { // this is used in the auth.controller.js which this function might as well be a part of
  // generating a token
  const token = jwt.sign({userId}, process.env.JWT_SECRET, { // payload, secret key, options
    expiresIn: "7d"
  })

  // sending the token to the user via a cookie
  res.cookie("jwt", token, {  // we will access this cookie in the middleware
    maxAge: 7 * 24 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development"
  })

  return token;
}