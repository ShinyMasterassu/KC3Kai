(function() {
	"use strict";

	function categoryEq(n) {
		return function (mst) {
			return mst.api_type[2] /* category */ === n;
		};
	}

	function iconEq(n) {
		return function (mst) {
			return mst.api_type[3] /* icon */ === n;
		};
	}

	// a predicate combinator, "anyOf(f,g)(x)" is the same as "f(x) || g(x)"
	// test all predicates passed as argument in order,
	// return the first non-falsy value or "false" if all predicates have falled.
	function anyOf(/* list of predicates */) {
		let args = arguments;
		return function(x) {
			for (let f of args) {
				let result = f(x);
				if (result)
					return result;
			}
			return false;
		};
	}

	// AA Radar (12 for small, 13 for large)
	// Surface Radar are excluded by checking whether
	// the equipment gives AA stat (api_tyku)
	function isAARadar(mst) {
		return (categoryEq(12)(mst) || categoryEq(13)(mst)) && 
			mst.api_tyku > 0;
	}

	// AAFD: check by category (36)
	var isAAFD = categoryEq(36);

	// High-angle mounts: check by icon (16)
	var isHighAngleMount = iconEq(16);
	
	// Type 3 Shell
	var isType3Shell = categoryEq(18);

	// Anti-air gun includes machine guns and rocket launchers
	var isAAGun = categoryEq(21);

	var isRedGun = anyOf(
		iconEq(1),
		iconEq(2),
		iconEq(3));
	
	var isYellowGun = iconEq(4);
	var isFighter = categoryEq(6);
	var isDiveBomber = categoryEq(7);
	var isSeaplaneRecon = categoryEq(10);

	// for equipments the coefficient is different for
	// calculating adjusted ship AA stat and fleet AA stat,
	// so let's use the following naming convention:
	//
	// - "getShipXXX" is for calculating adjusted AA stat for individual ships
	// - "getFleetXXX" for fleet AA
	//
	// verbs might change but the same convention should follow.

	// TODO: abyssal equipments into consideration?

	// it is possible for conditions to have overlap:
	// Akizuki-gun for example is both high angle mount and short caliber main gun.
	// to resolve this:
	// - the conditions are re-ordered so the highest applicable
	//   modifier is always checked first.
	// - the wiki says main gun (red), so maybe an icon-based checker "isRedGun"
	//   might be more appropriate.

	function getShipEquipmentModifier(mst) {
		if (isAAGun(mst))
			return 6;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 4;
		if (isAARadar(mst))
			return 3;

		return 0;
	}

	function getFleetShipEquipmentModifier(mst) {
		if (isType3Shell(mst))
			return 0.6;
		if (isAARadar(mst))
			return 0.4;
		if (isHighAngleMount(mst) || isAAFD(mst))
			return 0.35;
		if (anyOf(isRedGun,
				  isYellowGun,
				  isAAGun,
				  isFighter,
				  isDiveBomber,
				  isSeaplaneRecon)(mst))
			return 0.2;

		return 0;
	}

	function getShipImprovementModifier(mst) {
		if (isAAGun(mst))
			return 4;
		if (isHighAngleMount(mst))
			return 3;
		if (isAARadar(mst))
			return 0;

		return 0;
	}

	function getFleetImprovementModifier(mst) {
		if (isHighAngleMount(mst))
			return 3;
		if (isAAFD(mst))
			return 2;
		if (isAARadar(mst))
			return 1.5;
		if (isAAGun(mst))
			return 0;

		return 0;
	}

	function calcEquipmentAADefense(mst,
									stars /* number 0..10 */,
									forFleet /* bool */) {
		var eTypMod = 
			(forFleet 
			 ? getFleetShipEquipmentModifier 
			 : getShipEquipmentModifier)(mst);
		var eImproveMod =
			(forFleet
			 ? getFleetImprovementModifier
			 : getShipImprovementModifier)(mst);
		var aaStat = mst.api_tyku;
		return eTypMod*aaStat + eImproveMod*Math.sqrt( stars );
	}

	// exporting module
	window.AntiAir = {
		isAARadar: isAARadar,
		isAAFD: isAAFD,
		isHighAngleMount: isHighAngleMount,
		isType3Shell: isType3Shell,
		isAAGun: isAAGun,
		isRedGun: isRedGun,
		isYellowGun: isYellowGun,

		getFleetShipEquipmentModifier: getFleetShipEquipmentModifier,
		getShipEquipmentModifier: getShipEquipmentModifier,
		getFleetImprovementModifier: getFleetImprovementModifier,
		getShipImprovementModifier: getShipImprovementModifier,

		calcEquipmentAADefense: calcEquipmentAADefense
	};
})();
