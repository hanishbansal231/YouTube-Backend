import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

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
    // console.log(req.body);

    if ([fullname, email, username, password].some(item => item?.trim() === '')) {
        throw new ApiError(400, 'All fields are required')
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(userExists);

    if (userExists) {
        throw new ApiError(409, 'User with email or username already exixts');
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
        ApiResponse(200, createdUser, 'Created Successfully...')
    )

});


export {
    registerUser,
}