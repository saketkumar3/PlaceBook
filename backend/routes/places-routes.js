const express = require('express');
const { check } = require('express-validator');

const { route } = require('express/lib/application');

const placesControllers = require('../controllers/places-controllers');
const router = express.Router();



router.get('/:pid',placesControllers.getPlacesById);

router.get('/user/:uid',placesControllers.getPlaceByUserId );

router.post('/',
 [
     check('title').not().isEmpty() ,
check('description').isLength({min: 5}),
check('address').not().isEmpty() ],

placesControllers.createPlace);

router.patch('/:pid',[
     check('title').not().isEmpty() ,
check('description').isLength({min: 5})
],placesControllers.updatePlace);

router.delete('/:pid',placesControllers.deletePlace);

module.exports = router;