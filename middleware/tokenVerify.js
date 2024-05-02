// const jwtToken = require('jsonwebtoken');

// const auth = async (req, res, next) => {
//   // check header
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer")) {
//     console.log("error: Authorization header missing or malformed");
//     return res.status(401).json({ error: 'Unauthorized' });
//   }
//   const token = authHeader.split(" ")[1];
//   try {
//     const payload = jwtToken.verify(token, process.env.ACCESS_SECRET_KEY);
//     req.user = {verify_company_url : payload.verify_company_url , user_id: payload.user_id , role_name : payload.role_name , role_id : payload.role_id , email_id: payload.email_id, company_name: payload.company_name};
//     console.log("user_id" ,req.user.user_id); 
//     next(); 
//   } catch (error) {
//     console.log("error", error);
//     return res.status(403).json({ error: error.message });
//   }
// };

// module.exports = auth;
