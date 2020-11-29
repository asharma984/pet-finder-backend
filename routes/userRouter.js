const router= require("express").Router();
const bcrypt=require("bcryptjs");
const User=require("../models/userModel");
const jwt=require("jsonwebtoken");
const auth=require("../middleware/auth");


//register route
router.post("/register", async(req,res)=>{
    
try{
    let {email,password,passwordCheck,username}=req.body;

//validation
if(!email || !password || !passwordCheck)
  return res.status(400).json({msg:"All fields are required"});

if(password.length<5)
  return res.status(400).json({msg:"Password should be greater than or equal to 5 characters"});

if(passwordCheck!==password)
  return res.status(400).json({msg:"Please enter the same password twice"});

if(!username)
  username=email;

const existingUser= await User.findOne({email:email});
if(existingUser)
   return res.status(400).json({msg:"Account with this email already exists"});


const salt=await bcrypt.genSalt();
const passwordHash=await bcrypt.hash(password,salt);

const newUser=new User({
    email,
    password:passwordHash,
    username
});

const savedUser=await newUser.save();
res.send(savedUser);
}
catch(err)
{
    res.status(500).json({error:err.message});
}

});

//login route

router.post("/login",async(req,res)=>{
try{
const {email,password}=req.body;
//validate 
if(!email || !password)
  return res.status(400).json({msg:"Enter all fields"});


const user=await User.findOne({email:email});
if(!user)
return res.status(400).json({msg:"This email does not exist"});


const isMatch=await bcrypt.compare(password,user.password);
if(!isMatch)
return res.status(500).json({msg:"Invalid credentials"});

const token=jwt.sign({id:user._id},process.env.JWT_SECRET);
res.json({
    token,
    user: {
        id:user._id,
        email:user.email,
        username:user.username
    }
})

}
catch(err)
{
   return res.status(500).json({error:err.message});
}
})

//delete route
router.delete("/delete",auth, async(req,res)=>{
    try{
        console.log(req.user);
 const deletedUser= await User.findByIdAndDelete(req.user);
 res.json(deletedUser);
    }
    catch(err)
{
   return res.status(500).json({error:err.message});
}
});

router.post("/tokeIsValid",async(req,res)=>{
  try{
    const token=req.header("x-auth-token");
    if(!token) return res.json(false);

    const verified=jwt.verify(token,process.env.JWT_SECRET);
    if(!verified) return res.json(false);

    const user=await User.findById(verified.id);
    if(!user) return res.json(false);

    return res.json(true);
  }
  catch(err)
{
   return res.status(500).json({error:err.message});
}
});


module.exports=router;