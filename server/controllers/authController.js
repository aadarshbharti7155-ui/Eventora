const User = require('../models/User.js');
const OTP = require('../models/OTP.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {sendOtpEmail} = require('../utils/email.js');

const generateToken = (id, role) =>{
    return jwt.sign({id, role}, process.env.JWT_SECRET, {expiresIn: '7d'});
}


//register user
exports.registerUser = async (req, res) => {
    const {name, email, password} = req.body;

    let userExists = await User.findOne({email});
    if(userExists) {
        return res.status(400).json({message: 'User already exists'});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({name, email, password:hashedPassword, role: 'user', isVerified: false});

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${email}: ${otp}`);
        await OTP.create({email, otp, action: 'account verification'});
        await sendOtpEmail(email, otp, 'account_verification');

        res.status(201).json({message: 'User registered successfully. Please check your email for the OTP to verify your account.',
        email: user.email
        });

        


    } catch (error) {
        res.status(400).json({message: error.message});
    }
};

//login user
exports.loginUser = async (req, res) => {
    const {email, password} = req.body;
    
    let user = await User.findOne({email});
    if(!user) {
        return res.status(400).json({message: 'Invalid credentials! Please Sign Up first.'});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        return res.status(400).json({message: 'Invalid credentials!'});
    }

    if(!user.isVerified && user.role === 'user') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await OTP.deleteMany({email,  action: 'account verification'}); //remove old otps

        await OTP.create({email, otp, action: 'account verification'});
        await sendOtpEmail(email, otp, 'account_verification');
        return res.status(400).json({error: 'Account not verified. Please check your email for the OTP to verify your account.'});
    }
    res.json({
        message: 'Login successful',
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
    });
};

//verify otp
exports.verifyOtp = async (req, res) => {
    const {email, otp} = req.body;
    const otpRecord = await OTP.findOne({email, otp, action: 'account verification'});
    if(!otpRecord) {
        return res.status(400).json({message: 'Invalid OTP!'});
    }
    const user = await User.findOneAndUpdate({email}, {isVerified: true});
    await OTP.deleteMany({email, action: 'account verification'}); //remove all otps for this email
    res.json(
        {
            message: 'Account verified successfully! You can now log in.',
            id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role)
        }
    );
}