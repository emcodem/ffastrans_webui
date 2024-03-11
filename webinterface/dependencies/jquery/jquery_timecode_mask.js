/*!
 * Timecode Input Mask
 * A simple jQuery input mask for SMPTE timecode
 *
 * @author  Maxime Arretche.
 * @version 1.0.0
 */

"use strict";


(function($) {
 
	$.fn.timecodeinputmask = function(opts) {
		
		// Main functions
		function init() {

			let input = this, $input = $(this);

			if( $input.data("timecodeinputmask-format") ){
				let format = $input.data("timecodeinputmask-format");
				
				if(!["HH:MM:SS:FF", "HH:MM", "HH:MM:SS", "MM:SS", "MM:SS:FF", "SS:FF"].includes(format)) throw new Error("Invalid format");

				input.timecodeinputmask.settings.format = format;
				input.timecodeinputmask.settings.groups = [];

				let i = 0;
				let groups = format.split(":");

				for(let group of groups){
					if(["HH", "MM", "SS", "FF"].includes(group)){

						let part = {
							start: i,
							end: i + 2,
							maxValue: group == "HH" ? 23 : group == "FF" ? ( (opts || {}).framerate || 25 ) - 1 : 59
						}

						input.timecodeinputmask.settings.groups.push(part);
						
					}
					else {
						throw new Error("Invalid format")
					}

					i += 3;
				}
			}

			if( typeof $input.data("timecodeinputmask-allownegative") == "boolean" ){
				input.timecodeinputmask.settings.allowNegative = !!$input.data("timecodeinputmask-allownegative");
			}

			if( input.value == "" ){
				input.value = input.timecodeinputmask.settings.groups.map( g => "00" ).join(":");
				$(input).trigger("input");
			}
		
		}

		function attachEvents(input) {

			init.call(input);

			$(input)
				.on("mousedown", e => EventHandlers.mousedownEvent.call(input, e))
				.on("mouseup", e => EventHandlers.mouseupEvent.call(input, e))
				.on("focus", e => EventHandlers.focusEvent.call(input, e))
				.on("click", e => EventHandlers.clickEvent.call(input, e))
				.on("paste", e => EventHandlers.pasteEvent.call(input, e))
				.on("keydown", e => EventHandlers.keydownEvent.call(input, e));

		}

		// Helper functions
		let Helpers = {
		 	setSelectedGroup:  function (groupIdx) {
				let input = this;

				if(typeof groupIdx !== "number" || groupIdx < 0)
					groupIdx = 0;

				if(groupIdx > input.timecodeinputmask.settings.groups.length - 1)
					groupIdx = input.timecodeinputmask.settings.groups.length - 1;

				let offset = input.value.slice(0, 1) == "-" ? 1 : 0;

				return input.setSelectionRange(input.timecodeinputmask.settings.groups[groupIdx].start + offset, input.timecodeinputmask.settings.groups[groupIdx].end + offset);
			},
		 	getGroupByPosition:  function (start, end) {
		 		let input = this, group = {}, offset = input.value.slice(0, 1) == "-" ? 1 : 0;

		 		if(start > -1 && typeof end == "undefined")
		 			group = input.timecodeinputmask.settings.groups.find(g => start >= g.start + offset && start <= g.end + offset);

		 		else if(start > -1 && end > -1)
		 			group = input.timecodeinputmask.settings.groups.find(g => g.start + offset == start && g.end + offset == end);

		 		return {idx: input.timecodeinputmask.settings.groups.indexOf(group), ...group, value: group ? input.value.slice(group.start + offset, group.end + offset) : undefined}
			},
			modifyGroupValue: function (groupIdx, value) {
				let input = this, offset = input.value.slice(0, 1) == "-" ? 1 : 0, group = input.timecodeinputmask.settings.groups[groupIdx]
				
				if(typeof group == "undefined"){
					Helpers.setSelectedGroup.call(input, 0);
					input.timecodeinputmask.iKeydown = 0;

					group = input.timecodeinputmask.settings.groups[0];
				}

				let before = input.value.slice(0, group.start + offset), after = input.value.slice(group.end + offset);

				value = parseInt(value);

				if(isNaN(value))
					value = 0;

				if(value < 0)
					value = group.maxValue || 99;

				if( (group.maxValue && value > group.maxValue) || value > 99 )
					value = 0;
				
				input.value = before + value.toString().padStart(2, "0") + after;
				$(input).trigger("input");

				return input.value;
			}
		};

		// Event Handles
		let EventHandlers = {
			keydownEvent: function(e) {
				let input = this;

				if(e.key == "ArrowLeft" || e.key == "ArrowRight"){
					// Move left and right
					let currentIdx = (Helpers.getGroupByPosition.call(input, input.selectionStart, input.selectionEnd) || {}).idx;

					if(currentIdx > -1){

						if(e.key == "ArrowLeft")
							setTimeout(() => { Helpers.setSelectedGroup.call(input, currentIdx - 1); }, 0);

						if(e.key == "ArrowRight")
							setTimeout(() => { Helpers.setSelectedGroup.call(input, currentIdx + 1); }, 0);
					
					}
					else {
						setTimeout(() => { Helpers.setSelectedGroup.call(input, 0); }, 0);
					}

					input.timecodeinputmask.iKeydown = 0;

					return false;
				}

				if(e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Backspace"){
					// Increment / Decrement / Erase
					let currentGroup = Helpers.getGroupByPosition.call(input, input.selectionStart, input.selectionEnd);
					let value = currentGroup.value;

					let newValue = parseInt(value) + (e.key == "ArrowUp" ? 1 : -1);

					if(e.key == "Backspace"){
						newValue = 0;

						if(currentGroup.idx == -1){
							input.value = "00000000".slice(input.timecodeinputmask.settings.groups.length * -2).match(/.{2}/g).join(":");
						}
					}

					Helpers.modifyGroupValue.call(input, currentGroup.idx, newValue);
					Helpers.setSelectedGroup.call(input, currentGroup.idx);
					input.timecodeinputmask.iKeydown = 0;
					
					return false;
				}

				if(e.key.match(/[0-9]/g)){
					// Type
					input.timecodeinputmask.iKeydown++;

					let currentGroup = Helpers.getGroupByPosition.call(input, input.selectionStart, input.selectionEnd);
					let nextGroup = input.timecodeinputmask.settings.groups[currentGroup.idx + 1] || input.timecodeinputmask.settings.groups[input.timecodeinputmask.settings.groups.length - 1];

					if(input.timecodeinputmask.iKeydown == 1){
						Helpers.modifyGroupValue.call(input, currentGroup.idx, e.key);
						
						let predictedValue = e.key + "0";
						if(currentGroup.maxValue && predictedValue > currentGroup.maxValue && nextGroup){
							setTimeout(() => { Helpers.setSelectedGroup.call(input, currentGroup.idx + 1); }, 0)
							input.timecodeinputmask.iKeydown = 0;
						}
						else{
							Helpers.setSelectedGroup.call(input, currentGroup.idx);
						}
					}

					if(input.timecodeinputmask.iKeydown == 2){
						let fullValue = parseInt(currentGroup.value.slice(1) + e.key);
						Helpers.modifyGroupValue.call(input, currentGroup.idx, fullValue);
						
						setTimeout(() => { Helpers.setSelectedGroup.call(input, currentGroup.idx + 1); }, 0)
						input.timecodeinputmask.iKeydown = 0;
					}

					return false;
				}

				if(e.key == "-" && input.timecodeinputmask.settings.allowNegative === true){
					// Toggle negative
					input.value = input.value.slice(0, 1) == "-" ? input.value.slice(1) : "-" + input.value;
					$(input).trigger("input");

					Helpers.setSelectedGroup.call(input, 0);
					input.timecodeinputmask.iKeydown = 0;

					return false;
				}

				if( e.key.length < 2 && e.key.match(/\D+/g) ){
					return false;
				}

			},
			clickEvent: function(e) {
				let input = this, caretPosition = input.selectionStart, targetGroupIdx = Helpers.getGroupByPosition.call(input, caretPosition).idx;

				setTimeout(() => { Helpers.setSelectedGroup.call(input, targetGroupIdx); }, 0);

				input.timecodeinputmask.iKeydown = 0;
			},
			pasteEvent: function(e) {
				e.preventDefault();
				e.stopPropagation();
			
				let input = this;
				let pastedData = e.originalEvent.clipboardData.getData("text");

				let sign = pastedData.slice(0, 1) === "-" ? -1 : 1;
				let pattern = "00".repeat(input.timecodeinputmask.settings.groups.length);
				let arrTimeParts = ( pattern + pastedData.replace(/[^0-9]/g, '') ).slice(input.timecodeinputmask.settings.groups.length * -2).match(/.{2}/g);

				if(arrTimeParts.length){
					input.value = arrTimeParts.join(":");
					$(input).trigger("input");
				}
			},
			focusEvent: function(e) {
				if(!this.timecodeinputmask.userInteract){
					setTimeout(() => { Helpers.setSelectedGroup.call(this, 0) }, 0)
					this.timecodeinputmask.iKeydown = 0;
				}
			},
			mousedownEvent: function(e) {
				this.timecodeinputmask.userInteract = true;
			},
			mouseupEvent: function(e) {
				this.timecodeinputmask.userInteract = false;
			}
		};

		// Init all elements
		return this.filter("input").each(function(idx, el) {
			
			el.timecodeinputmask = {};

			el.timecodeinputmask.settings = $.extend({
				allowNegative: false,
				framerate: 100,
				format: "HH:MM:SS:FF",
				groups: [
					{
						start: 0,
						end: 2,
						maxValue: 23
					},
					{
						start: 3,
						end: 5,
						maxValue: 59
					},
					{
						start: 6,
						end: 8,
						maxValue: 59
					},
					{
						start: 9,
						end: 11,
						maxValue: ( (opts || {}).framerate || 100 ) - 1
					}
				]
			}, opts );

			el.timecodeinputmask.iKeydown = 0;
			el.timecodeinputmask.userInteract = false;

			attachEvents( el );

		});
		
	};

	$(function() {
		$("[data-timecodeinputmask]").timecodeinputmask();
	});

}(jQuery));