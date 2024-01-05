import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refereshToken = user.generateRefreshToken();

        user.refreshToken = refereshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refereshToken };

    } catch (error) {
        throw new ApiError(500, 'soemthing went wrong while generating aceess and referesh token')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /*
    -> Get User Details form user
    -> Validation - not empty
    -> check if user already exists: Username, email
    -> check for images, check for avatar
    -> upload them to cloudinary,avatar
    -> create user object - create entry in db
    -> remove password and refresh token field from response
    -> check for user creation
    -> return res
     */

    const { fullname, email, username, password } = req.body;
    console.log(req.body);

    if ([fullname, email, username, password].some(item => item?.trim() === '')) {
        throw new ApiError(400, 'All fields are required')
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    // console.log(userExists);

    if (userExists) {
        throw new ApiError(409, 'User with email or username already exixts');
    }

    console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required')
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || '',
    });

    const createdUser = await User.findById(user._id).select('-password -refreshToken');

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'Created Successfully...')
    )

});

const loginUser = asyncHandler(async (req, res) => {
    /*
    -> req.body - data
    -> username or email
    -> find the user
    -> password check
    -> access and referesh token
    -> send cookie
    -> res
     */

    const { username, email, password } = req.body;

    // -> User only one like email or username
    // if (!(username || email)) { 
    //     throw new ApiError(400, 'username or email is required')
    // }

    // if (!username || !email) { 
    //     throw new ApiError(400, 'username or email is required')
    // }


    if (!username && !email) {
        throw new ApiError(400, 'username or email is required')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });


    if (!user) {
        throw new ApiError(404, "user doesn't exixt");
    }

    if (!(await user.comparePassword(password))) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { refereshToken, accessToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(201)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refereshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refereshToken
            }, 'User logged in successfully')
        )

});

const logoutUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const user = await User.findByIdAndUpdate(_id, {
        $set: {
            refreshToken: undefined
        }
    }, {
        new: true
    });

    const options = {
        httpOnly: true,
        secure: true,
    }


    return res
        .status(201)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(
            new ApiResponse(200, {}, 'User logout successfully')
        )

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodeToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { NewrefereshToken, accessToken } = await generateAccessAndRefereshTokens(user?._id);

        return res
            .status(201)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', NewrefereshToken, options)
            .json(
                new ApiResponse(200, {
                    user, accessToken, NewrefereshToken
                }, 'Access token refreshed')
            )
    } catch (error) {
        throw new ApiError(500, error.message || 'Invalid refresh token')
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}