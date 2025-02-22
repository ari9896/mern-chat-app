import jwt from "jsonwebtoken"
import User from '../models/user.model.js'

export const protectRoute = async (req, res, next) => {
    try {
      const token = req.cookies.jwt // 'jwt' is a name we selected. this is what we called it in the utils // requires cookieparser // a generated string of characters that will be decoded
      if (!token) {
        return res.status(401).json({ message: "Unauthorized - No token provided"})
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) // returns a decoded payload that's an object with userId, role, exp, etc. keys
      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized - Invalid token"})
      }

      const user = await User.findById(decoded.userId).select("-password"); // this makes sure that the id in the decoded token matches the id in the db

      if (!user) {
        return res.status(404).json({ message: "User not found"})
      }

      req.user = user;
      next()
    } catch (error) {
      console.log("Error in protectRoute middlewarer: ", error.message);
      res.status(500).json({ message: "Internal Server Error"})
    }
}