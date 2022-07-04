/// Initial Vlues for Dimensions
const settings = {
  rootElementId: 'cardboard-box',
  animationDelay: 0,
  dielineRequest: !!uDielineRequest ? uDielineRequest : "false",
  itemID: !!uItemID ? uItemID : null,
  flute: !!uFlute ? uFlute : 0.16,
  quantity: !!uQuantity ? uQuantity : 500,
  size: {
    scale: 0.5,
    length: !!uLength ? uLength : 7.0,
    width: !!uWidth ? uWidth : 7.0,
    height: !!uHeight ? uHeight : 7.0,
  },
  rotate: {
    x: 330.0,
    y: 330.0,
  },
  shadow: {
    opacity: 0.3,
    blur: 3,
    distance: -25.0,
  }
};

/// "Basic"  is board / numbr of boxes * profit
/// "GoodCurve" with interpolated function below competitor prics
/// "InitialCurve" with interpolaed function averaginc comptitor prics.
var pricingModel = "GoodCurve";

/// GoodCurve is InitialCurve * InterpolationReductionScale
var interpolationReductionScale = 0.75;

/// The pixInchConverter mulitplier used to scale pixels to inches visually
const pixInchConverter = 28.0;

/// Glue flap size
const glueFlap = 1.5;

/// Flute size
var flute = 0.16;

var optLengthMax = 0; //0.2
var optWidthMax = 0; //0.16 ## not sure about that here. We should discuss it!

/// Borad maximum and minimum size
const boardLength = 96.0;
const boardWidth = 48.0;

// This number should be between 0 and 1
// It denotes what scale of change is acceptable in exchange of more boxes
var bigCutTolerance = 0.25;

var priceScalings = [[1000, 1.05], [500, 1.05], [250, 1.05], [100, 1.05], [25, 1.05]];

var boardPrice = 4.42;
var minimalProfitMargin = 1.15;

/// Minimum values for box dimensions
const minBoxLength = 4.0;
const minBoxWidth = 4.0;
const minBoxHeight = 3.0;

/// Size constraint based on production
/// Minimum value for box dimension
const minLengthPlusWidth = 9.0;

/// Addition length width and height
var boxLWD;

/// Maximum values for box dimensions
var maxBoxLength = (((boardLength - 1.5 - (flute * 4)) * 0.5) - minBoxWidth);
var maxBoxWidth = (((boardLength - 1.5 - (flute * 4)) * 0.5) - minBoxLength);
var maxBoxHeight = boardWidth - minBoxWidth - (flute * 2);

/// Box measurements
var length = settings.size.length;
var width = settings.size.width;
var height = settings.size.height;

const minQuantity = 1;
const maxQuantity = 5000;
/// Price increase based on request for print
const dielineMarkupMultiplier = 1.20;

var quantity = settings.quantity;
var dielineMarkup = 1;
var dielineMarkupLowQ = 0;
var totalPrice;

const equals = (a, b) =>
  a.length === b.length &&
  a.every((v, i) => v === b[i]);

function suggestion_NoHandicup(length, width, height) {
  var Ans = [];
  var optLength = 0.0;
  var optWidth = 0.0;

  var manfLengthSugggestion = true;
  var manfWidthSugggestion = true;

  if (2 * length + 2 * width + 3 * flute + glueFlap - optLengthMax > boardLength) {
    return "boardLength does not fit";
  }

  if (height + width - optWidthMax > boardWidth) {
    return "boardWidth does not fit";
  }

  var manfLength_NoOpt = 2 * length + 2 * width + 3 * flute + glueFlap;
  var manfWidth_NoOpt = height + width;
  var manfLength_Opt = 0;
  var manfWidth_Opt = 0;

  var initialcountLength = Math.floor(boardLength / manfLength_NoOpt);
  var initialcountWidth = Math.floor(boardWidth / manfWidth_NoOpt);

  var reminderLength_NoOpt = boardLength - manfLength_NoOpt * initialcountLength;
  var reminderWidth_NoOpt = boardWidth - manfWidth_NoOpt * initialcountWidth;

  if (manfLength_NoOpt - reminderLength_NoOpt <= optLengthMax * initialcountLength) {
    /// No need to adjust length here, just use opt!
    optLength = reminderLength_NoOpt / initialcountLength;
    manfLength_Opt = 2 * length + 2 * width + 3 * flute + glueFlap - optLength;
    manfLengthSugggestion = false;
  }

  if (manfWidth_NoOpt - reminderWidth_NoOpt <= optWidth * initialcountWidth) {
    /// No need to adjust width here, just use opt!
    optWidth = reminderWidth_NoOpt / initialcountWidth;
    manfWidth_Opt = height + width - optWidth;
    manfWidthSugggestion = false;
  }


  if (!manfLengthSugggestion && !manfWidthSugggestion) {
    /// if we are here, then the optimization variables are enough to use full board
    Ans.push([width, length, height, optLength, optWidth]);
  }

  if (!manfLengthSugggestion && manfWidthSugggestion) {
    /// if we are here, then only modification of Beadth/ManfWidth is needd, ManfLngth fits well using optimization

    /// Here we have two uptions: To suggest increased box size, or decreased size

    /// Note also that if only Breath needs to be modified, we can not touch box width, as it will change the ManfLength too

    /// So only opyion is to change height

    var newHeightIncreased = boardWidth / (initialcountWidth) - width;  /// If we make same number of boxes from the sheet, but larger

    var newHeightDecreased = boardWidth / (initialcountWidth + 1) - width + optWidthMax; /// If we make one more box per width, but smaller.

    Ans.push([width, length, newHeightIncreased, optLength, 0]);

    Ans.push([width, length, newHeightDecreased, optLength, optWidthMax]);
  }

  if (manfLengthSugggestion && !manfWidthSugggestion) {
    /// if we are here, then only modification of Beadthwidth is needd, ManfWidth fits well using optimization

    /// Here we have two uptions: To suggest increased box size, or decreased size

    /// Note also that if only ManfLength needs to be modified, we can not touch box width, as it will change the Manfwidth too

    var newLengthIncreased = (boardLength / initialcountLength - glueFlap - 3 * flute - 2 * width) / 2;  /// If we make same number of boxes from the sheet, but larger

    var newLengthDecreased = (boardLength / (initialcountLength + 1) - glueFlap - 3 * flute - 2 * width + optLengthMax) / 2; /// If we make one more box per length, but smaller.

    Ans.push([width, newLengthIncreased, height, 0, optWidth]);

    if (newLengthDecreased > width) {
      Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
    }
    else {
      var optWidth_new = optWidth - (width - newLengthDecreased);
      Ans.push([newLengthDecreased, width, height, optLengthMax, Math.max(optWidth_new, 0)]);
    }
  }

  if (manfLengthSugggestion && manfWidthSugggestion) {
    /// Here we are at the case where we can do many modifications
    /// We need some logic to choose the increase or decrease of each parameter

    var increaseManfLength = true;
    var increaseManfWidth = true;

    var decreaseManfLength = true;
    var decreaseManfWidth = true;

    if (increaseManfLength && increaseManfWidth) {
      /// Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap) / (2 + 2 * width / length);
      var newWidthIncreased = width * newLengthIncreased / length;

      var newHeightIncreased = boardWidth / initialcountWidth - newWidthIncreased;  // How do I know it is increased? I dont, mayb width was increased much more below...

      Ans.push([newWidthIncreased, newLengthIncreased, newHeightIncreased, 0, 0])
    }

    if (decreaseManfLength && decreaseManfWidth) {

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap + optLengthMax) / (2 + 2 * width / length);
      var newWidthDecreased = width * newLengthDecreased / length;

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - newWidthDecreased;  // Again, maybe I actually increased hight?

      Ans.push([newWidthDecreased, newLengthDecreased, newHeightDecreased, optLengthMax, optWidthMax]);
    }

    if (increaseManfLength && decreaseManfWidth) {
      /// Here comes the problematic case, when one side needs increase, another decreas
      /// In such case it makes sense not to touch width, as it will affect both sides

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;
      var newWidthIncreased = width;

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - newWidthIncreased;

      Ans.push([newWidthIncreased, newLengthIncreased, newHeightDecreased, 0, optWidthMax]);
    }

    if (decreaseManfLength && increaseManfWidth) {
      /// Here we should not touch width, unlss we need to decrease length so much that it goes below width

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap + optLengthMax - 2 * width) / 2;
      var newWidthDecreased = width;

      if (newLengthDecreased < width) {
        newWidthDecreased = (newLengthDecreased + width) / 2;
        newLengthDecreased = newWidthDecreased;
      }

      var newHeightIncreased = boardWidth / initialcountWidth - newWidthDecreased;

      Ans.push([newWidthDecreased, newLengthDecreased, newHeightIncreased, optLengthMax, 0]);
    }

    if (decreaseManfWidth) {
      /// Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - width

      Ans.push([width, length, newHeightDecreased, 0, optWidthMax]);
    }

    if (increaseManfWidth) {
      /// Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightIncreased = boardWidth / (initialcountWidth) - width;

      Ans.push([width, length, newHeightIncreased, optLength, 0]);
    }

    if (decreaseManfLength) {

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * width + optLengthMax) / 2;

      if (newLengthDecreased > width) {
        Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
      }
      else {
        var optWidth_new = optWidth - (width - newLengthDecreased);
        Ans.push([newLengthDecreased, width, height, optLengthMax, Math.max(optWidth_new, 0)]);
      }
    }

    if (increaseManfLength) {
      /// Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;

      Ans.push([width, newLengthIncreased, height, 0, 0]);
    }
  }

  Ans.push([width, length, height, 0, 0]);

  var newAns = [];

  for (i = 0; i < Ans.length; i++) {
    var arr = Ans[i];

    if (arr[0] < 4 || arr[1] < 4 || arr[2] < 3 || arr[0] + arr[1] < 9)
      continue;

    arr[0] = arr[0] - 0.0001;
    arr[1] = arr[1] - 0.0001;
    arr[2] = arr[2] - 0.001;

    var manfLength_arr = 2 * arr[1] + 2 * arr[0] + 3 * flute + glueFlap - arr[3];
    var manfWidth_arr = arr[2] + arr[0] - arr[4];

    if (manfLength_arr > boardLength + 0.0001 || manfWidth_arr > boardWidth + 0.001)
      continue

    var countLength = boardLength / manfLength_arr;
    var countWidth = boardWidth / manfWidth_arr;
    arr.push(countLength);
    arr.push(countWidth);

    //for(j = 0; j < arr.length; j++) {
    //  arr[j] = Math.round(arr[j] * 100) / 100; //  rounding up to two decimal points
    //}
    arr.push(Math.floor(countLength + 0.0001) * Math.floor(countWidth + 0.0001));

    [arr[0], arr[1]] = [arr[1], arr[0]];

    newAns.push(arr);
  }
  newAns.reverse(); // As my array is built from strangest to common, I reverse it. Also that way first one will be the not-modified case

  return newAns;
}

function suggestion_HandicupWidth(length, width, height) {
  var Ans = [];

  var optLength = 0.0;
  var optWidth = 0.0;

  var manfLengthSugggestion = true;
  var manfWidthSugggestion = true;

  if (2 * length + 2 * width + 3 * flute + glueFlap - optLengthMax > boardLength) {
    return "boardLength does not fit";
  }

  if (height + width - optWidthMax > boardWidth) {
    return "boardWidth does not fit";
  }

  var manfLength_NoOpt = 2 * length + 2 * width + 3 * flute + glueFlap;
  var manfWidth_NoOpt = height + width;
  var manfLength_Opt = 0;
  var manfWidth_Opt = 0;

  var initialcountLength = Math.floor(boardLength / manfLength_NoOpt);
  var initialcountWidth = Math.floor(boardWidth / manfWidth_NoOpt);

  var reminderLength_NoOpt = boardLength - manfLength_NoOpt * initialcountLength;
  var reminderWidth_NoOpt = boardWidth - manfWidth_NoOpt * initialcountWidth;

  if (manfLength_NoOpt - reminderLength_NoOpt <= optLengthMax * initialcountLength) {
    // No need to adjust length here, just use opt!
    optLength = reminderLength_NoOpt / initialcountLength;
    manfLength_Opt = 2 * length + 2 * width + 3 * flute + glueFlap - optLength;
    manfLengthSugggestion = false;
  }

  if (manfWidth_NoOpt - reminderWidth_NoOpt <= optWidth * initialcountWidth) {
    // No need to adjust width here, just use opt!
    optWidth = reminderWidth_NoOpt / initialcountWidth;
    manfWidth_Opt = height + width - optWidth;
    manfWidthSugggestion = false;
  }

  if (!manfLengthSugggestion && !manfWidthSugggestion) {
    // if we are here, then the optimization variables are enough to use full board

    Ans.push([width, length, height, optLength, optWidth]);
  }

  if (!manfLengthSugggestion && manfWidthSugggestion) {
    // if we are here, then only modification of Beadth/ManfWidth is needd, ManfLngth fits well using optimization

    // Here we have two uptions: To suggest increased box size, or decreased size

    // Note also that if only Breath needs to be modified, we can not touch box width, as it will change the ManfLength too

    // So only opyion is to change height

    var newHeightIncreased = boardWidth / (initialcountWidth) - width;  //If we make same number of boxes from the sheet, but larger

    var newHeightDecreased = boardWidth / (initialcountWidth + 1) - width + optWidthMax; // If we make one more box per width, but smaller.

    Ans.push([width, length, newHeightIncreased, optLength, 0]);

    Ans.push([width, length, newHeightDecreased, optLength, optWidthMax]);
  }

  if (manfLengthSugggestion && !manfWidthSugggestion) {
    // if we are here, then only modification of ManfLngth is needd, ManfWidth fits well using optimization

    // Here we have two uptions: To suggest increased box size, or decreased size

    // Note also that if only ManfLength needs to be modified, we can not touch box width, as it will change the Manfwidth too

    var newLengthIncreased = (boardLength / initialcountLength - glueFlap - 3 * flute - 2 * width) / 2;  // If we make same number of boxes from the sheet, but larger

    var newLengthDecreased = (boardLength / (initialcountLength + 1) - glueFlap - 3 * flute - 2 * width + optLengthMax) / 2; // If we make one more box per length, but smaller.

    Ans.push([width, newLengthIncreased, height, 0, optWidth]);

    if (newLengthDecreased > width) {
      Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
    }
  }

  if (manfLengthSugggestion && manfWidthSugggestion) {
    // Here we are at the case where we can do many modifications
    // We need some logic to choose the increase or decrease of each parameter

    var increaseManfLength = true; // Need to come up with the logic
    var increaseManfWidth = true;  // Need to come up with the logic

    var decreaseManfLength = true; // Need to come up with the logic
    var decreaseManfWidth = true;  // Need to com up with the logic

    if (increaseManfLength && increaseManfWidth) {
      // Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;

      var newHeightIncreased = boardWidth / initialcountWidth - width;

      Ans.push([width, newLengthIncreased, newHeightIncreased, 0, 0]);
    }

    if (decreaseManfLength && decreaseManfWidth) {

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * width + optLengthMax) / 2;

      if (newLengthDecreased > width) {
        var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - width;

        Ans.push([width, newLengthDecreased, newHeightDecreased, optLengthMax, optWidthMax]);
      }
    }

    if (increaseManfLength && decreaseManfWidth) {
      // Here comes the problematic case, when one side needs increase, another decreas
      // In such case it makes sense not to touch width, as it will affect both sides

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - width;

      Ans.push([width, newLengthIncreased, newHeightDecreased, 0, optWidthMax]);
    }

    if (decreaseManfLength && increaseManfWidth) {
      // Here we should not touch width, unlss we need to decrease length so much that it goes below width

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap + optLengthMax - 2 * width) / 2;

      if (newLengthDecreased > width) {
        var newHeightIncreased = boardWidth / initialcountWidth - width;

        Ans.push([width, newLengthDecreased, newHeightIncreased, optLengthMax, 0]);
      }
    }

    if (decreaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - width;

      Ans.push([width, length, newHeightDecreased, 0, optWidthMax]);
    }

    if (increaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightIncreased = boardWidth / (initialcountWidth) - width;

      Ans.push([width, length, newHeightIncreased, optLength, 0]);
    }

    if (decreaseManfLength) {

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * width + optLengthMax) / 2;

      if (newLengthDecreased > width) {
        Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
      }
    }


    if (increaseManfLength) {
      // Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;

      Ans.push([width, newLengthIncreased, height, 0, 0]);
    }
  }

  Ans.push([width, length, height, 0, 0]);

  var newAns = [];

  for (i = 0; i < Ans.length; i++) {
    var arr = Ans[i];

    if (arr[0] < 4 || arr[1] < 4 || arr[2] < 3 || arr[0] + arr[1] < 9)
      continue;

    arr[0] = arr[0] - 0.0001;
    arr[1] = arr[1] - 0.0001;
    arr[2] = arr[2] - 0.001;


    var manfLength_arr = 2 * arr[1] + 2 * arr[0] + 3 * flute + glueFlap - arr[3];
    var manfWidth_arr = arr[2] + arr[0] - arr[4];

    if (manfLength_arr > boardLength + 0.0001 || manfWidth_arr > boardWidth + 0.001)
      continue;

    var countLength = boardLength / manfLength_arr;
    var countWidth = boardWidth / manfWidth_arr;

    arr.push(countLength);
    arr.push(countWidth);


    //for(j = 0; j < arr.length; j++) {
    //  arr[j] = Math.round(arr[j] * 100) / 100; //  rounding up to two decimal points
    //}
    arr.push(Math.floor(countLength + 0.0001) * Math.floor(countWidth + 0.0001));

    [arr[0], arr[1]] = [arr[1], arr[0]];

    newAns.push(arr);
  }

  newAns.reverse(); // As my array is built from strangest to common, I reverse it. Also that way first one will be the not-modified case

  return newAns;
}

function suggestion_HandicupLength(length, width, height) {
  var Ans = [];

  var optLength = 0.0;
  var optWidth = 0.0;

  var manfLengthSugggestion = true;
  var manfWidthSugggestion = true;

  if (2 * length + 2 * width + 3 * flute + glueFlap - optLengthMax > boardLength) {
    return "boardLength does not fit";
  }

  if (height + width - optWidthMax > boardWidth) {
    return "boardWidth does not fit";
  }

  var manfLength_NoOpt = 2 * length + 2 * width + 3 * flute + glueFlap;
  var manfWidth_NoOpt = height + width;
  var manfLength_Opt = 0;
  var manfWidth_Opt = 0;

  var initialcountLength = Math.floor(boardLength / manfLength_NoOpt);
  var initialcountWidth = Math.floor(boardWidth / manfWidth_NoOpt);

  var reminderLength_NoOpt = boardLength - manfLength_NoOpt * initialcountLength;
  var reminderWidth_NoOpt = boardWidth - manfWidth_NoOpt * initialcountWidth;

  if (manfLength_NoOpt - reminderLength_NoOpt <= optLengthMax * initialcountLength) {
    //No need to adjust length here, just use opt!
    optLength = reminderLength_NoOpt / initialcountLength;
    manfLength_Opt = 2 * length + 2 * width + 3 * flute + glueFlap - optLength;
    manfLengthSugggestion = false;
  }

  if (manfWidth_NoOpt - reminderWidth_NoOpt <= optWidth * initialcountWidth) {
    // No need to adjust width here, just use opt!
    optWidth = reminderWidth_NoOpt / initialcountWidth;
    manfWidth_Opt = height + width - optWidth;
    manfWidthSugggestion = false;
  }

  if (!manfLengthSugggestion && !manfWidthSugggestion) {
    // if we are here, then the optimization variables are enough to use full board

    Ans.push([width, length, height, optLength, optWidth]);
  }

  if (!manfLengthSugggestion && manfWidthSugggestion) {
    // if we are here, then only modification of Beadth/ManfWidth is needd, ManfLngth fits well using optimization

    // Here we have two uptions: To suggest increased box size, or decreased size

    // Note also that if only Breath needs to be modified, we can not touch box width, as it will change the ManfLength too

    // So only opyion is to change height

    var newHeightIncreased = boardWidth / (initialcountWidth) - width;  // If we make same number of boxes from the sheet, but larger

    var newHeightDecreased = boardWidth / (initialcountWidth + 1) - width + optWidthMax; //If we make one more box per width, but smaller.

    Ans.push([width, length, newHeightIncreased, optLength, 0]);

    Ans.push([width, length, newHeightDecreased, optLength, optWidthMax]);
  }

  // if (manfLengthSugggestion && !manfWidthSugggestion) {
  // if we are here, then only modification of ManfLngth is needd, ManfWidth fits well using optimization
  // As length is fixed, and modifing width results in modifying ManfWidth as well, we skip this part
  // }

  if (manfLengthSugggestion && manfWidthSugggestion) {
    // Here we are at the case where we can do many modifications
    // We need some logic to choose the increase or decrease of each parameter

    var increaseManfLength = true;  // Need to come up with the logic
    var increaseManfWidth = true;   // Need to come up with the logic

    var decreaseManfLength = true;  // Need to come up with the logic
    var decreaseManfWidth = true;   // Need to com up with the logic

    if (increaseManfLength && increaseManfWidth) {

      var newWidthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * length) / 2;

      if (newWidthIncreased < length) {
        var newHeightIncreased = boardWidth / initialcountWidth - newWidthIncreased;  // How do I know it is increased? I dont, mayb width was increased much more below...
        if (newHeightIncreased > 0) {
          Ans.push([newWidthIncreased, length, newHeightIncreased, 0, 0]);
        }
      }
    }

    if (decreaseManfLength && decreaseManfWidth) {
      var newWidthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * length + optLengthMax) / 2;

      if (newWidthDecreased < length) {

        var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - newWidthDecreased;  // Again, maybe I actually increased hight?

        Ans.push([newWidthDecreased, length, newHeightDecreased, optLengthMax, optWidthMax]);
      }
    }

    if (increaseManfLength && decreaseManfWidth) {
      // Here comes the problematic case, when one side needs increase, another decreas
      // In such case it makes sense not to touch width, as it will affect both sides

      var newWidthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * length) / 2;

      if (newWidthIncreased < length) {
        var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - newWidthIncreased;
        if (newHeightDecreased > 0) {
          Ans.push([newWidthIncreased, length, newHeightDecreased, 0, optWidthMax]);
        }
      }
    }

    if (decreaseManfLength && increaseManfWidth) {
      // Here we should not touch width, unlss we need to decrease length so much that it goes below width

      var newWidthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap + optLengthMax - 2 * length) / 2;

      var newHeightIncreased = boardWidth / initialcountWidth - newWidthDecreased;

      Ans.push([newWidthDecreased, length, newHeightIncreased, optLengthMax, 0]);
    }

    if (decreaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - width;


      Ans.push([width, length, newHeightDecreased, 0, optWidthMax]);
    }

    if (increaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newHeightIncreased = boardWidth / (initialcountWidth) - width;

      Ans.push([width, length, newHeightIncreased, optLength, 0]);
    }
    if (decreaseManfLength) {

      var newWidthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * length + optLengthMax) / 2;

      optWidth_new = optWidth - (width - newWidthDecreased);
      Ans.push([newWidthDecreased, length, height, optLengthMax, Math.max(optWidth_new, 0)]);
    }

    if (increaseManfLength) {
      // Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newWidthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * length) / 2;

      if (newWidthIncreased < length && newWidthIncreased + height < Math.floor(boardLength / initialcountWidth)) {
        Ans.push([newWidthIncreased, length, height, 0, 0]);
      }
    }
  }

  Ans.push([width, length, height, 0, 0]);

  var newAns = [];

  for (i = 0; i < Ans.length; i++) {
    var arr = Ans[i];

    if (arr[0] < 4 || arr[1] < 4 || arr[2] < 3 || arr[0] + arr[1] < 9)
      continue;

    arr[0] = arr[0] - 0.0001;
    arr[1] = arr[1] - 0.0001;
    arr[2] = arr[2] - 0.001;


    var manfLength_arr = 2 * arr[1] + 2 * arr[0] + 3 * flute + glueFlap - arr[3];
    var manfWidth_arr = arr[2] + arr[0] - arr[4];

    if (manfLength_arr > boardLength + 0.0001 || manfWidth_arr > boardWidth + 0.001)
      continue;

    var countLength = boardLength / manfLength_arr;
    var countWidth = boardWidth / manfWidth_arr;

    arr.push(countLength);
    arr.push(countWidth);

    //for(j = 0; j < arr.length; j++) {
    //  arr[j] = Math.round(arr[j] * 100) / 100; //  rounding up to two decimal points
    //}
    arr.push(Math.floor(countLength + 0.0001) * Math.floor(countWidth + 0.0001));

    [arr[0], arr[1]] = [arr[1], arr[0]];

    newAns.push(arr);
  }

  newAns.reverse(); // As my array is built from strangest to common, I reverse it. Also that way first one will be the not-modified case

  return newAns;
}

function suggestion_HandicupHeight(length, width, height) {
  var Ans = [];

  var optLength = 0.0;
  var optWidth = 0.0;

  var manfLengthSugggestion = true;
  var manfWidthSugggestion = true;

  if (2 * length + 2 * width + 3 * flute + glueFlap - optLengthMax > boardLength) {
    return "boardLength does not fit";
  }

  if (height + width - optWidthMax > boardWidth) {
    return "boardWidth does not fit";
  }

  var manfLength_NoOpt = 2 * length + 2 * width + 3 * flute + glueFlap;
  var manfWidth_NoOpt = height + width;
  var manfLength_Opt = 0;
  var manfWidth_Opt = 0;

  var initialcountLength = Math.floor(boardLength / manfLength_NoOpt);
  var initialcountWidth = Math.floor(boardWidth / manfWidth_NoOpt);

  var reminderLength_NoOpt = boardLength - manfLength_NoOpt * initialcountLength;
  var reminderWidth_NoOpt = boardWidth - manfWidth_NoOpt * initialcountWidth;

  if (manfLength_NoOpt - reminderLength_NoOpt <= optLengthMax * initialcountLength) {
    // No need to adjust length here, just use opt!
    optLength = reminderLength_NoOpt / initialcountLength;
    manfLength_Opt = 2 * length + 2 * width + 3 * flute + glueFlap - optLength;
    manfLengthSugggestion = false;
  }

  if (manfWidth_NoOpt - reminderWidth_NoOpt <= optWidth * initialcountWidth) {
    // No need to adjust width here, just use opt!
    optWidth = reminderWidth_NoOpt / initialcountWidth;
    manfWidth_Opt = height + width - optWidth;
    manfWidthSugggestion = false;
  }

  if (!manfLengthSugggestion && !manfWidthSugggestion) {
    // if we are here, then the optimization variables are enough to use full board

    Ans.push([width, length, height, optLength, optWidth]);
  }

  //if (!manfLengthSugggestion && manfWidthSugggestion) {
  // if we are here, then only modification of Beadth/ManfWidth is needd, ManfLngth fits well using optimization
  // As we have fixed height, we can not edit Breadth without messing up 
  //?

  if (manfLengthSugggestion && !manfWidthSugggestion) {
    // if we are here, then only modification of Beadthwidth is needd, ManfWidth fits well using optimization

    // Here we have two uptions: To suggest increased box size, or decreased size

    // Note also that if only ManfLength needs to be modified, we can not touch box width, as it will change the Manfwidth too

    var newLengthIncreased = (boardLength / initialcountLength - glueFlap - 3 * flute - 2 * width) / 2; // If we make same number of boxes from the sheet, but larger

    var newLengthDecreased = (boardLength / (initialcountLength + 1) - glueFlap - 3 * flute - 2 * width + optLengthMax) / 2; // If we make one more box per length, but smaller.

    Ans.push([width, newLengthIncreased, height, 0, optWidth]);

    if (newLengthDecreased > width) {
      Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
    }
    else {
      var optWidth_new = optWidth - (width - newLengthDecreased);
      Ans.push([newLengthDecreased, width, height, optLengthMax, Math.max(optWidth_new, 0)]);
    }
  }

  if (manfLengthSugggestion && manfWidthSugggestion) {
    // Here we are at the case where we can do many modifications
    // We need some logic to choose the increase or decrease of each parameter

    var increaseManfLength = true; // Need to come up with the logic
    var increaseManfWidth = true;  // Need to come up with the logic

    var decreaseManfLength = true; // Need to come up with the logic
    var decreaseManfWidth = true;  // Need to com up with the logic

    if (increaseManfLength && increaseManfWidth) {
      // Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newWidthIncreased = boardWidth / initialcountWidth - height;

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * newWidthIncreased) / 2;

      if (newWidthIncreased < newLengthIncreased) {
        Ans.push([newWidthIncreased, newLengthIncreased, height, 0, 0]);
      }
    }

    if (decreaseManfLength && decreaseManfWidth) {

      var newWidthDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - height;

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * newWidthDecreased + optLengthMax) / 2;

      if (newWidthDecreased < newLengthDecreased) {
        Ans.push([newWidthDecreased, newLengthDecreased, height, optLengthMax, optWidthMax]);
      }
    }

    if (increaseManfLength && decreaseManfWidth) {
      // Here comes the problematic case, when one side needs increase, another decreas
      // In such case it makes sense not to touch width, as it will affect both sides

      var newWidthDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - height;

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * newWidthDecreased) / 2;

      Ans.push([newWidthDecreased, newLengthIncreased, height, 0, optWidthMax]);
    }

    if (decreaseManfLength && increaseManfWidth) {

      var newWidthIncreased = boardWidth / initialcountWidth - height;

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap + optLengthMax - 2 * newWidthIncreased) / 2;

      if (newLengthDecreased > newWidthIncreased) {
        Ans.push([newWidthIncreased, newLengthDecreased, height, optLengthMax, 0]);
      }
    }

    if (decreaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newWidthDecreased = boardWidth / (initialcountWidth + 1) + optWidthMax - height;

      Ans.push([newWidthDecreased, length, height, 0, optWidthMax]);
    }

    if (increaseManfWidth) {
      // Here We Just adjust ManfWidth and Leave ManfLength as is

      var newWidthIncreased = boardWidth / (initialcountWidth) - height;

      if (newWidthIncreased < length && 2 * newWidthIncreased + 2 * length + 3 * flute + glueFlap < Math.floor(boardLength / initialcountLength)) {
        Ans.push([newWidthIncreased, length, height, optLength, 0]);
      }
    }

    if (decreaseManfLength) {

      var newLengthDecreased = (boardLength / (initialcountLength + 1) - 3 * flute - glueFlap - 2 * width + optLengthMax) / 2;

      if (newLengthDecreased > width) {
        Ans.push([width, newLengthDecreased, height, optLengthMax, optWidth]);
      }
      else {
        var optWidth_new = optWidth - (width - newLengthDecreased)
        Ans.push([newLengthDecreased, width, height, optLengthMax, Math.max(optWidth_new, 0)]);
      }
    }

    if (increaseManfLength) {
      // Here, assuming I do not have restrictions, I keep width/length ratio constant, as an arbitrary choice needed for unique solution

      var newLengthIncreased = (boardLength / initialcountLength - 3 * flute - glueFlap - 2 * width) / 2;

      Ans.push([width, newLengthIncreased, height, 0, 0]);
    }
  }

  Ans.push([width, length, height, 0, 0]);

  var newAns = [];

  for (i = 0; i < Ans.length; i++) {
    var arr = Ans[i];

    if (arr[0] < 4 || arr[1] < 4 || arr[2] < 3 || arr[0] + arr[1] < 9)
      continue;

    arr[0] = arr[0] - 0.0001;
    arr[1] = arr[1] - 0.0001;
    arr[2] = arr[2] - 0.001;

    var manfLength_arr = 2 * arr[1] + 2 * arr[0] + 3 * flute + glueFlap - arr[3];
    var manfWidth_arr = arr[2] + arr[0] - arr[4];

    if (manfLength_arr > boardLength + 0.0001 || manfWidth_arr > boardWidth + 0.001)
      continue;

    var countLength = boardLength / manfLength_arr;
    var countWidth = boardWidth / manfWidth_arr;

    arr.push(countLength);
    arr.push(countWidth);

    //for(j = 0; j < arr.length; j++) {
    //  arr[j] = Math.round(arr[j] * 100) / 100; //  rounding up to two decimal points
    //}
    arr.push(Math.floor(countLength + 0.0001) * Math.floor(countWidth + 0.0001));

    [arr[0], arr[1]] = [arr[1], arr[0]];

    newAns.push(arr);
  }

  newAns.reverse(); // As my array is built from strangest to common, I reverse it. Also that way first one will be the not-modified case

  return newAns;
}

function LargeSuggestion(Arr) {

  var Ansarr = Arr[0];

  for (i = 0; i < Arr.length; i++) {
    var arr = Arr[i];
    if (arr[7] <= Ansarr[7] + 0.001)
      if (arr[6] <= Ansarr[6] + 0.001)
        if (arr[5] <= Ansarr[5] + 0.001)
          Ansarr = arr;
  }

  return Ansarr;
}

function ParseSuggestions(Ans, chosen = []) {
  var OriginalCount = Ans[0][7];
  var InitialFractionNorm = 100000000;
  var Suggestion = [];

  for (ii = 0; ii < Ans.length; ii++) {
    var arr = Ans[ii];
    var foundIndex = -1;

    for (j = 0; j < chosen.length; j++) {
      if (equals(chosen[j], arr)) {
        foundIndex = j;
        break;
      }
    }

    if (arr[7] <= OriginalCount)
      continue;
    if (foundIndex >= 0)
      continue;

    // Check if the price is actually better!

    if (PriceFormula(arr[0], arr[1], arr[2]) > PriceFormula(Ans[0][0], Ans[0][1], Ans[0][2]))
      continue;

    var Frac1 = arr[0] / Ans[0][0] - 1;
    var Frac2 = arr[1] / Ans[0][1] - 1;
    var Frac3 = arr[2] / Ans[0][2] - 1;

    var FractionNorm = (Frac1) ** 2 + (Frac2) ** 2 + (Frac3) ** 2;

    if (1 - bigCutTolerance < Frac1 && Frac1 < 1 + bigCutTolerance &&
      1 - bigCutTolerance < Frac1 && Frac1 < 1 + bigCutTolerance &&
      1 - bigCutTolerance < Frac1 && Frac1 < 1 + bigCutTolerance) {

      if (InitialFractionNorm > 999999) {
        InitialFractionNorm = FractionNorm;
        Suggestion = arr;
      }

      if (arr[7] > Suggestion[7]) {
        InitialFractionNorm = FractionNorm;
        Suggestion = arr;
      }
    }

    if (FractionNorm < InitialFractionNorm) {
      InitialFractionNorm = FractionNorm;
      Suggestion = arr;
    }
  }

  return Suggestion;
}

function PriceFormula(L, W, H, Q, optLength = 0.0, optWidth = 0.0) {
  var manfLengthSugggestion = true;
  var manfWidthSugggestion = true;
  var basePrice = 0.0;

  if (2 * L + 2 * W + 3 * flute + glueFlap - optLengthMax > boardLength)
    return "boardLength does not fit";

  if (H + W - optWidthMax > boardWidth)
    return "boardWidth does not fit";

  var manfLength_NoOpt = 2 * L + 2 * W + 3 * flute + glueFlap;

  var manfWidth_NoOpt = H + W;

  var initialcountLength = Math.floor(boardLength / manfLength_NoOpt + 0.0001);
  var initialcountWidth = Math.floor(boardWidth / manfWidth_NoOpt + 0.0001);

  var reminderLength_NoOpt = boardLength - manfLength_NoOpt * initialcountLength;
  var reminderWidth_NoOpt = boardWidth - manfWidth_NoOpt * initialcountWidth;

  var optLength = 0;
  var manfLength_Opt = 0;
  var manfWidth_Opt = 0;

  if (manfLength_NoOpt - reminderLength_NoOpt <= optLengthMax * initialcountLength) {
    // No need to adjust length here, just use opt!
    optLength = reminderLength_NoOpt / initialcountLength;
    manfLength_Opt = 2 * L + 2 * L + 3 * flute + glueFlap - optLength;
    initialcountLength = initialcountLength + 1;
  }

  if (manfWidth_NoOpt - reminderWidth_NoOpt <= optWidth * initialcountWidth) {
    // No need to adjust width here, just use opt!
    optWidth = reminderWidth_NoOpt / initialcountWidth;
    manfWidth_Opt = H + W - optWidth;
    initialcountWidth = initialcountWidth + 1;
  }
  var AmountMade = initialcountWidth * initialcountLength;

  var Coef = [1.80541253203807E-06,
    -2.2003849972687E-05,
    0.000105942434528,
    0.000142589170871,
    0.015083639999037,
    -0.000325998346899,
    3.60876116575969E-05,
    -0.000308626158221,
    3.32192526567646E-05,
    0.043453209570737,
    0.000338014018395,
    -3.93791843756321E-07,
    -0.000201533078421,
    4.5964198381629E-08,
    -8.7598836856329E-06,
    0.000135958561147,
    -4.74975198574231E-05,
    -1.70749048194984E-07,
    -0.000186592457174,
    -9.06932895969026E-05,
    1.22972771803787E-05,
    4.93583428362504E-05,
    -1.80432699933661E-05,
    1.74879022576964E-08,
    6.4759838972065E-07,
    3.38526594785479E-06,
    -6.51653069639664E-08];

  var InitialFunctionValue =
    Coef[0] +
    Coef[1] * H ** 1 +
    Coef[2] * H ** 2 +
    Coef[3] * W ** 1 +
    Coef[4] * W ** 1 * H ** 1 +
    Coef[5] * W ** 1 * H ** 2 +
    Coef[6] * W ** 2 +
    Coef[7] * W ** 2 * H ** 1 +
    Coef[8] * W ** 2 * H ** 2 +
    Coef[9] * L ** 1 +
    Coef[10] * L ** 1 * H ** 1 +
    Coef[11] * L ** 1 * H ** 2 +
    Coef[12] * L ** 1 * W ** 1 +
    Coef[13] * L ** 1 * W ** 1 * H ** 1 +
    Coef[14] * L ** 1 * W ** 1 * H ** 2 +
    Coef[15] * L ** 1 * W ** 2 +
    Coef[16] * L ** 1 * W ** 2 * H ** 1 +
    Coef[17] * L ** 1 * W ** 2 * H ** 2 +
    Coef[18] * L ** 2 +
    Coef[19] * L ** 2 * H ** 1 +
    Coef[20] * L ** 2 * H ** 2 +
    Coef[21] * L ** 2 * W ** 1 +
    Coef[22] * L ** 2 * W ** 1 * H ** 1 +
    Coef[23] * L ** 2 * W ** 1 * H ** 2 +
    Coef[24] * L ** 2 * W ** 2 +
    Coef[25] * L ** 2 * W ** 2 * H ** 1 +
    Coef[26] * L ** 2 * W ** 2 * H ** 2;


  if (pricingModel == "Basic")
    basePrice = (boardPrice / AmountMade * minimalProfitMargin) * dielineMarkup;

  if (pricingModel == "InitialCurve") {
    if (InitialFunctionValue < (boardPrice / AmountMade) * minimalProfitMargin)
      basePrice = ((boardPrice / AmountMade) * minimalProfitMargin) * dielineMarkup;
    else
      basePrice = ((InitialFunctionValue + (boardPrice / AmountMade) * minimalProfitMargin) / 2) * dielineMarkup;
  }

  if (pricingModel == "GoodCurve") {
    if (InitialFunctionValue * interpolationReductionScale < (boardPrice / AmountMade) * minimalProfitMargin)
      basePrice = ((boardPrice / AmountMade) * minimalProfitMargin) * dielineMarkup;
    else
      basePrice = ((InitialFunctionValue * interpolationReductionScale + (boardPrice / AmountMade) * minimalProfitMargin) / 2) * dielineMarkup;
  }

  for (i = 0; i < priceScalings.length; i++) {
    var scale = priceScalings[i];
    if (Q < scale[0])
      basePrice = basePrice * scale[1];
  }

  return basePrice;
}

function calculate() {
  var W = Number(document.getElementById("inputWidth").value);
  var H = Number(document.getElementById("inputHeight").value);
  var L = Number(document.getElementById("inputLength").value);
  var Q = Number(document.getElementById("inputQuantityInput").value);

  if (!document.getElementById("inputWidth").value)
    W = Number("NAN");
  if (!document.getElementById("inputHeight").value)
    H = Number("NAN");
  if (!document.getElementById("inputLength").value)
    L = Number("NAN");
  if (!document.getElementById("inputQuantityInput").value)
    Q = Number("NAN");

  if (!isNaN(W) && !isNaN(H) && !isNaN(L) && !isNaN(Q)) {
    // Minimum constraints check
    if (W < 4 || L < 4 || H < 3 || L + W < 9) {
      document.getElementById("Original").style.display = "none";
      document.getElementById("NH").style.display = "none";
      document.getElementById("LH").style.display = "none";
      document.getElementById("WH").style.display = "none";
      document.getElementById("HH").style.display = "none";
      document.getElementById("BB").style.display = "none";

      // document.getElementById("result_error_panel").innerText = "Too small sizes";
      // document.getElementById("result_error_panel").style.display = "block";
      return;
    }
    //document.getElementById("input_panel").style.display = "none";
    var Price = PriceFormula(L, W, H, Q);
    var suggestionsList = [];

    AnsNH = suggestion_NoHandicup(L, W, H);
    // console.log("AnsNH = " + JSON.stringify(AnsNH));
    AnsWH = suggestion_HandicupWidth(L, W, H);
    // console.log("AnsWH = " + JSON.stringify(AnsWH));
    AnsLH = suggestion_HandicupLength(L, W, H);
    // console.log("AnsLH = " + JSON.stringify(AnsLH));
    AnsHH = suggestion_HandicupHeight(L, W, H);
    // console.log("AnsHH = " + JSON.stringify(AnsHH));

    if (AnsNH == "boardLength does not fit" || AnsNH == "boardWidth does not fit") {
      document.getElementById("Original").style.display = "none";
      document.getElementById("NH").style.display = "none";
      document.getElementById("LH").style.display = "none";
      document.getElementById("WH").style.display = "none";
      document.getElementById("HH").style.display = "none";
      document.getElementById("BB").style.display = "none";
      // document.getElementById("result_error_panel").innerText = AnsNH;
      // document.getElementById("result_error_panel").style.display = "block";
    }
    else {
      var ansLS = LargeSuggestion(AnsNH);
      // console.log("ansLS = " + JSON.stringify(ansLS));

      if (ansLS.length > 0) {
        suggestionsList.push(ansLS);
        var price_LS = PriceFormula(ansLS[0], ansLS[1], ansLS[2], Q)

        document.getElementById("BBL").innerText = Math.round(ansLS[0] * 100) / 100;
        document.getElementById("BBW").innerText = Math.round(ansLS[1] * 100) / 100;
        document.getElementById("BBH").innerText = Math.round(ansLS[2] * 100) / 100;
        document.getElementById("BBP").innerText = "$ " + Math.round(price_LS * 100) / 100;
        document.getElementById("BBPS").innerText = Math.round((Price - price_LS) / price_LS * 100 * 100) / 100 + " %";
        document.getElementById("BB").style.display = "inline-block";
      }
      else {
        document.getElementById("BB").style.display = "none";
      }

      var finalSuggestion_NoHandicup = ParseSuggestions(AnsNH);

      if (finalSuggestion_NoHandicup.length > 0) {
        suggestionsList.push(finalSuggestion_NoHandicup);
        var Price_NH = PriceFormula(finalSuggestion_NoHandicup[0], finalSuggestion_NoHandicup[1], finalSuggestion_NoHandicup[2], Q);
        // console.log("No Handicap " + JSON.stringify(finalSuggestion_NoHandicup) + "  " + Price_NH);
        document.getElementById("NHL").innerText = Math.round(finalSuggestion_NoHandicup[0] * 100) / 100;
        document.getElementById("NHW").innerText = Math.round(finalSuggestion_NoHandicup[1] * 100) / 100;
        document.getElementById("NHH").innerText = Math.round(finalSuggestion_NoHandicup[2] * 100) / 100;
        document.getElementById("NHP").innerText = "$ " + Math.round(Price_NH * 100) / 100;
        document.getElementById("NHPS").innerText = Math.round((Price - Price_NH) / Price * 100 * 100) / 100 + " %";
        document.getElementById("NH").style.display = "inline-block";
      }
      else {
        document.getElementById("NH").style.display = "none";
      }

      var finalSuggestion_LengthHandicup = ParseSuggestions(AnsLH, suggestionsList);

      if (finalSuggestion_LengthHandicup.length > 0) {
        suggestionsList.push(finalSuggestion_LengthHandicup);
        var Price_LH = PriceFormula(finalSuggestion_LengthHandicup[0], finalSuggestion_LengthHandicup[1], finalSuggestion_LengthHandicup[2], Q);
        // console.log("length Handicap " + JSON.stringify(finalSuggestion_LengthHandicup) + "  " + Price_LH);
        document.getElementById("LHL").innerText = Math.round(finalSuggestion_LengthHandicup[0] * 100) / 100;
        document.getElementById("LHW").innerText = Math.round(finalSuggestion_LengthHandicup[1] * 100) / 100;
        document.getElementById("LHH").innerText = Math.round(finalSuggestion_LengthHandicup[2] * 100) / 100;
        document.getElementById("LHP").innerText = "$ " + Math.round(Price_LH * 100) / 100;
        document.getElementById("LHPS").innerText = Math.round((Price - Price_LH) / Price * 100 * 100) / 100 + " %";
        document.getElementById("LH").style.display = "inline-block";
      }
      else {
        document.getElementById("LH").style.display = "none";
      }

      var finalSuggestion_WidthHandicup = ParseSuggestions(AnsWH, suggestionsList);

      if (finalSuggestion_WidthHandicup.length > 0) {
        suggestionsList.push(finalSuggestion_WidthHandicup);
        var Price_WH = PriceFormula(finalSuggestion_WidthHandicup[0], finalSuggestion_WidthHandicup[1], finalSuggestion_WidthHandicup[2], Q);
        // console.log("width Handicap " + JSON.stringify(finalSuggestion_WidthHandicup) + "  " + Price_WH);
        document.getElementById("WHL").innerText = Math.round(finalSuggestion_WidthHandicup[0] * 100) / 100;
        document.getElementById("WHW").innerText = Math.round(finalSuggestion_WidthHandicup[1] * 100) / 100;
        document.getElementById("WHH").innerText = Math.round(finalSuggestion_WidthHandicup[2] * 100) / 100;
        document.getElementById("WHP").innerText = "$ " + Math.round(Price_WH * 100) / 100;
        document.getElementById("WHPS").innerText = Math.round((Price - Price_WH) / Price * 100 * 100) / 100 + " %";
        document.getElementById("WH").style.display = "inline-block";
      }
      else {
        document.getElementById("WH").style.display = "none";
      }

      var finalSuggestion_HightHandicup = ParseSuggestions(AnsHH, suggestionsList);

      if (finalSuggestion_HightHandicup.length > 0) {
        suggestionsList.push(finalSuggestion_HightHandicup);
        var Price_HH = PriceFormula(finalSuggestion_HightHandicup[0], finalSuggestion_HightHandicup[1], finalSuggestion_HightHandicup[2], Q);
        // console.log("height Handicap " + JSON.stringify(finalSuggestion_HightHandicup) + "  " + Price_HH);
        document.getElementById("HHL").innerText = Math.round(finalSuggestion_HightHandicup[0] * 100) / 100;
        document.getElementById("HHW").innerText = Math.round(finalSuggestion_HightHandicup[1] * 100) / 100;
        document.getElementById("HHH").innerText = Math.round(finalSuggestion_HightHandicup[2] * 100) / 100;
        document.getElementById("HHP").innerText = "$ " + Math.round(Price_HH * 100) / 100;
        document.getElementById("HHPS").innerText = Math.round((Price - Price_HH) / Price * 100 * 100) / 100 + " %";
        document.getElementById("HH").style.display = "inline-block";
      }
      else {
        document.getElementById("HH").style.display = "none";
      }

      document.getElementById("OriginalL").innerText = Math.round(L * 100) / 100;
      document.getElementById("OriginalW").innerText = Math.round(W * 100) / 100;
      document.getElementById("OriginalH").innerText = Math.round(H * 100) / 100;
      // document.getElementById("OriginalP").innerText = Math.round(Price * 100) / 100;
      // document.getElementById("OriginalPQ").innerText = Math.round(Q * Price * 100) / 100;
      document.getElementById("outputPricePerUnit").innerText = Math.round(Price * 100) / 100;
      document.getElementById("outputPricePerUnitHidden").innerText = Math.round(Price * 100) / 100;
      document.getElementById("outputTotalPrice").innerText = Math.round(Q * Price * 100) / 100;
      document.getElementById("outputTotalPriceHidden").innerText = Math.round(Q * Price * 100) / 100;

      document.getElementById("Original").style.display = "inline-block";
      // document.getElementById("result_error_panel").style.display = "none";
      // console.log("Price : " + Price);
    }
  }
  else {
    document.getElementById("Original").style.display = "none";
    document.getElementById("NH").style.display = "none";
    document.getElementById("LH").style.display = "none";
    document.getElementById("WH").style.display = "none";
    document.getElementById("HH").style.display = "none";
    document.getElementById("BB").style.display = "none";
  }

  // document.getElementById("error_width").style.visibility = isNaN(W) ? 'visible' : 'hidden';
  // document.getElementById("error_height").style.visibility = isNaN(H) ? 'visible' : 'hidden';
  // document.getElementById("error_length").style.visibility = isNaN(L) ? 'visible' : 'hidden';
  // document.getElementById("error_quantity").style.visibility = isNaN(Q) ? 'visible' : 'hidden';
}

/// Listen for changes in Dieline Request Toggle
document.addEventListener('DOMContentLoaded', function () {
  var checkbox = document.querySelector('input[id="switch"]');
  var inst = document.getElementById("instructions").style.display;

  if (uDielineRequest == "true") {
    checkbox.checked = true;
    dielineMarkup = dielineMarkupMultiplier
    dielineMarkupLowQ = 8.75
    dielineRequestHidden.value = "true";
    document.getElementById("instructions").style.display = "block";
    calculate();
  } else {
    checkbox.checked = false;
    dielineMarkup = 1
    dielineMarkupLowQ = 1
    dielineRequestHidden.value = "false";
    document.getElementById("instructions").style.display = "none";
    calculate();
  }

  checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
      dielineMarkup = dielineMarkupMultiplier
      dielineMarkupLowQ = 8.75
      dielineRequestHidden.value = "true";
      alert("hello");
      document.getElementById("instructions").style.display = "block";
      calculate();
    } else {
      dielineMarkup = 1
      dielineMarkupLowQ = 1
      dielineRequestHidden.value = "false";
      document.getElementById("instructions").style.display = "none";
      calculate();
    }
  });
}); 

function updateStyleVars() {
  var boxLWD = (parseFloat(length) + parseFloat(width) + parseFloat(height));

  const styleVars = '--animationDelay: ' + settings.animationDelay + 's' +
    ';--height: ' + ((length) * pixInchConverter) + 'px' +
    ';--width: ' + ((width) * pixInchConverter) + 'px' +
    ';--length: ' + ((height) * pixInchConverter) + 'px' +
    ';--scale: ' + settings.size.scale +
    ';--shadowOpacity: ' + settings.shadow.opacity +
    ';--shadowBlur: ' + settings.shadow.blur + 'em' +
    ';--shadowDistance: ' + settings.shadow.distance + 'px' +
    ';--rotateDegX: ' + settings.rotate.x + 'deg' +
    ';--rotateDegY: ' + settings.rotate.y + 'deg' +
    ';--perspective: ' + ('calc(var(--width) + var(--length) + var(--height))') + ';';

  document.getElementById(settings.rootElementId).setAttribute('style', styleVars);
}

/// Function ensures that values inputed fall between min and max
function inputValueCorrection(value, minValue, maxValue) {
  var correctedValue;
  document.getElementById("dimensionError").style.display = "none";

  if (value > maxValue) {
    correctedValue = maxValue
    document.getElementById("dimensionError").style.display = "block"
  } else if (value < minValue) {
    correctedValue = minValue
    document.getElementById("dimensionError").style.display = "block"
  } else {
    correctedValue = value
  }

  return correctedValue;
}


function setLength(value) {
  /// Obtain corrected value and set
  document.getElementById("dimensionError").style.display = "none";
  length = inputValueCorrection(value, minBoxLength, maxBoxLength);

  /// Make sure the intput also reflects the correct value
  inputLength.value = length;
  inputLengthHidden.value = length;

  length = parseFloat(length);
  width = parseFloat(width);
  flute = parseFloat(flute);
  height = parseFloat(height);

  /// If the minLengthPlusWidth is violated then increase width value by difference
  if (length + width < minLengthPlusWidth) {
    width = width + minLengthPlusWidth - (length + width)
    inputWidth.value = width
    inputWidthHidden.value = width
    document.getElementById("dimensionError").style.display = "block";
  }

  /// If the boardLength is violated then decrease width value by difference
  if (((length + width) * 2) + 1.5 + (flute * 4) > boardLength) {
    width = (((boardLength - 1.5 - (flute * 4)) * 0.5) - length)
    inputWidth.value = width
    inputWidthHidden.value = width
    document.getElementById("dimensionError").style.display = "block";
  }

  updateStyleVars();
  calculate();
}

function setWidth(value) {
  /// Obtain corrected value and set
  document.getElementById("dimensionError").style.display = "none";
  width = inputValueCorrection(value, minBoxWidth, maxBoxWidth);

  /// Make sure the intput also reflects the correct value
  inputWidth.value = width;
  inputWidthHidden.value = width;

  length = parseFloat(length);
  width = parseFloat(width);
  flute = parseFloat(flute);
  height = parseFloat(height);

  /// If the minLengthPlusWidth is violated then increase length value by difference
  if (length + width < minLengthPlusWidth) {
    length = length + minLengthPlusWidth - (length + width)
    inputLength.value = length
    inputLengthHidden.value = length
    document.getElementById("dimensionError").style.display = "block";
  }

  /// If the boardLength is violated then decrease length value by difference
  if (((length + width) * 2) + 1.5 + (flute * 4) > boardLength) {
    length = (((boardLength - 1.5 - (flute * 4)) * 0.5) - width)
    inputLength.value = length
    inputLengthHidden.value = length
    document.getElementById("dimensionError").style.display = "block";
  }

  // If the boardHeight is violated then decrease width value by difference
  if (((height + width) + (flute * 2) > boardWidth)) {
    height = (((boardWidth - (flute * 2)) - width))
    inputHeight.value = height
    inputHeightHidden.value = height
    document.getElementById("dimensionError").style.display = "block";
  }

  updateStyleVars();
  calculate();
}

function setHeight(value) {
  document.getElementById("dimensionError").style.display = "none";
  /// Obtain corrected value and set
  height = inputValueCorrection(value, minBoxHeight, maxBoxHeight);

  /// Make sure the intput also reflects the correct value
  inputHeight.value = height;
  inputHeightHidden.value = height;

  length = parseFloat(length);
  width = parseFloat(width);
  flute = parseFloat(flute);
  height = parseFloat(height);

  /// If the boardHeight is violated then decrease width value by difference
  // CHANGE BY AM
  if (((height + width) + (flute * 2) > boardWidth)) {
    width = (((boardWidth - (flute * 2)) - height))
    inputWidth.value = width
    inputWidthHidden.value = width
    document.getElementById("dimensionError").style.display = "block";
  }

  updateStyleVars();
  calculate();
}

function setFlute(value) {
  settings.flute = value;
  flute = value;
  inputFluteHidden.value = value;

  calculate();
  setLength(length);
  setWidth(width);
}

function setQuantity(value) {
  quantity = inputValueCorrection(value, minQuantity, maxQuantity);
  inputQuantityRange.value = quantity;
  inputQuantityInput.value = quantity;

  calculate();
}

function rotateY(angle) {
  settings.rotate.y = angle;
  updateStyleVars();
}

function updateControls() {
  document.getElementById('inputFluteHidden').value = settings.flute;
  document.getElementById('inputLengthHidden').value = settings.size.length;
  document.getElementById('inputWidthHidden').value = settings.size.width;
  document.getElementById('inputHeightHidden').value = settings.size.height;
  document.getElementById('outputTotalPriceHidden').value = totalPrice;
  document.getElementById('dielineRequestHidden').value = settings.dielineRequest;
  document.getElementById('itemID').value = settings.itemID;

  document.getElementById('outputTotalPrice').textContent = totalPrice;
  document.getElementById('inputQuantityRange').value = settings.quantity;
  document.getElementById('inputQuantityInput').value = settings.quantity;
  document.getElementById('inputFlute').value = settings.flute;
  document.getElementById('inputLength').value = settings.size.length;
  document.getElementById('inputWidth').value = settings.size.width;
  document.getElementById('inputHeight').value = settings.size.height;
  document.getElementById('control-rotate-y').value = settings.rotate.y;
}

function init() {
  updateStyleVars();
  updateControls();
  setTimeout(function () {
    document.getElementById('cube').style.display = 'block';
    calculate();
  }, settings.animationDelay * 1000);
}

init();

function copy_values(length_id, height_id, width_id) {
  document.getElementById("inputWidth").value = document.getElementById(width_id).innerText;
  document.getElementById("inputHeight").value = document.getElementById(height_id).innerText;
  document.getElementById("inputLength").value = document.getElementById(length_id).innerText;
  calculate();
}


document.getElementById("NH_btn").onclick = function () { copy_values("NHL", "NHH", "NHW"); };
document.getElementById("HH_btn").onclick = function () { copy_values("HHL", "HHH", "HHW"); };
document.getElementById("WH_btn").onclick = function () { copy_values("WHL", "WHH", "WHW"); };
document.getElementById("LH_btn").onclick = function () { copy_values("LHL", "LHH", "LHW"); };
document.getElementById("BB_btn").onclick = function () { copy_values("BBL", "BBH", "BBW"); };
