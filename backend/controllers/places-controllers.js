
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const  {mongoose, Types}  = require('mongoose');






const getPlacesById = async(req,res,next) => {
    const placeId = req.params.pid; // {pid : 'p1'}

    let place;
    try{
        place = await Place.findById(placeId); 
    } catch(err) {
        const error = new HttpError('Something went wrong, could not find a place.',500)
        return next(error);
    }
    
    if(!place){
        const error=  new HttpError('Could not find a place for the provided id.',404);
        return next(error);
    }

     res.json({places : place.toObject( {getters: true }) }); // => {place} =>{ place : place}
}


const getPlaceByUserId =  async (req, res, next) => {
    const userId = req.params.uid;
    
    //let places ;
    let userWithPlaces;
    try{
       
        userWithPlaces = await User.findById(userId).populate('places');

    }
    catch(err){
        const error = new HttpError('Fetching places failed, please try again later',500)
        return next(error);

    }
    //if(!place || places.length == 0) {}
    if(!userWithPlaces || userWithPlaces.places.length === 0)
    {
        
       return next(new HttpError('Could not find a place for the provided id.',404));
    }

    res.json({places : userWithPlaces.places.map(place => place.toObject({ getters: true}))});

}
const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {   console.log(errors);
        return next(new HttpError('Invalid inputs passed, please check your data',422));

    }

    const {title, description  , address, creator} =req.body;
    // const title = req.body.title;

    let coordinates;
    try{
        coordinates = await getCoordsForAddress(address);
    } catch(error){
        return next(error);
    }

    const createdPlace = new Place({
        
        title,// title: title
        description,
        address,
        location: coordinates,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Subhas_Chandra_Bose_NRB.jpg/330px-Subhas_Chandra_Bose_NRB.jpg',
        creator
    });

    let user;

    try{
      user = await User.findById(creator);  
    } catch(err){
        const error = new HttpError('Creating place failed, please try again',500);
        return next(error);
    }

    if(!user){
        const error = new HttpError('Could not find user for provided id',404);
        return next(error);
    }
    console.log(user);
    console.log("###",createdPlace);

    try{
        const sess = await mongoose.startSession();
        await sess.startTransaction();
        const savedData = await createdPlace.save({session: sess});
        console.log(savedData);
        user.places.push(createdPlace);
        //const userEntity = new User(user);
      // await  userEntity.save();
      const condition = {
        _id: Types.ObjectId(creator),
    };
     const saveData = await User.findByIdAndUpdate(condition, user, { new: true, upsert: false });
        console.log(saveData);
        console.log("CONDITION",condition);

        //const saveUser = await user.save();
       // console.log("USSSSSSSSER:",saveUser);
        await sess.commitTransaction();
        
    } catch(err){
        console.log("Error :",err);
        const error = new HttpError('Creating place failed please try agian.',500);
        return next(error);

    }
    
    res.status(201).json({place: createdPlace});
    
};

const updatePlace = async(req,res,next) =>{

    const errors = validationResult(req);
    if(!errors.isEmpty())
    {   console.log(errors);
        return next( new HttpError('Invalid inputs passed, please check your data',422));

    }
    
    const {title, description} =req.body;
    const placeId = req.params.pid;

   
    let place;
    try{
        place = await Place.findById(placeId);
    } catch(err){
        const error = new HttpError('Something went wrong, could not update place.',500);
        return next(error);
    }
    place.title = title;
    place.description = description;
    
   try{
       await place.save();
   }
   catch(err)
   {
       const error = new HttpError('Something went wrong , could not update place',500);
       return next(error);
   }
    

    res.status(200).json({place: place.toObject({ getters: true})});
 
};

const deletePlace = async (req,res,next) =>{
    const placeId = req.params.pid;
    let place;
    try{
        place = await Place.findById(placeId).populate('creator');
    }
    catch(err)
    {
        const error = new HttpError('Something went wrong, could not delete place',500);
        return next(error);
    }

    if(!place){
        const error = new HttpError('Could not find place for this id.',404);
        return next(error);
    }

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();

    }catch(err){
        const error = new HttpError('Something went wrong, could not delete place',500);
        return next(error);
    }
    res.status(200).json({mesage: 'Deleted Place.'});

};
exports.getPlacesById = getPlacesById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;