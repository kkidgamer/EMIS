// import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET 

const auth=(req,res,next)=>{
    //extract the authorization header
 const authHeader = req.headers.authorization
 // get the token from the header
 const token = authHeader && authHeader.split(' ')[1]

 // check if we have the token 
 if(!token){
     return res.status(401).json({message: 'Unauthorized access, please login'})
 }
 try {
    // verify the token using the secret key
     const decode = jwt.verify(token, JWT_SECRET)
     // we attatch the payload to the request object
        req.user = decode
        //proceed to the next middleware or route handler
        next()
 } catch (error) {
     return res.status(500).json({message: 'Internal server error', error: error.message})
    
 }
}

// middleware to authorize user based on role
// accepts any number of allowed roles(eg: ['admin', 'worker'])
//...params -accepts any number of arguments and automatically puts them into an array
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // check if the user role is in the allowed roles
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({message: 'Access denied, you do not have permission to perform this action'})
        }
        //proceed to the next middleware or route handler
        next()
    }
}

module.exports = {auth, authorizeRoles}