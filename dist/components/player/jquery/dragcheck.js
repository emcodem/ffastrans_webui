$.fn.dragCheck = function(selector){ 
 
    if (selector===false)
      return this.find('*').andSelf().add(document).unbind('.dc').removeClass('dc-selected')
        .filter(':has(:checkbox)').css({MozUserSelect: '', cursor: ''});
      
    else 
      return this.each(function(){ 
        
        // if a checkbox is clicked this will be set to
        // it's checked state (true||false), otherwise null
        var mdown = null;
  
        // get the specified container, or children if not specified
       
        $(this).find(selector).filter(':has(:checkbox)').each(function(){
              
          // highlight all already checked boxes
          if ( $(this).find(':checkbox:checked').length )
             $(this).addClass('dc-selected');
             
        })
         .bind('mouseover.dc', function(){ 
         
           // if a checkbox was clicked and mouse button bein held down
           if (mdown != null){
             // set this container's checkbox to the
             // same state as the one first clicked
             $(this).find(':checkbox')[0].checked = mdown;
             // add the highlight class
             
           }
           
        }) 
         .bind('mousedown.dc', function(e){
           
           // find this container's checkbox
           var t = e.target;
           if ( !$(t).is(':checkbox') )
             t = $(this).find(':checkbox')[0];
  
           // switch it's state (click event will be canceled later)
           t.checked = !t.checked;
           // set the value to which other hovered
           // checkboxes will be set while the mouse is down
           mdown = t.checked;
             
           // highlight this one according to it's state
           $(this).toggleClass('dc-selected', mdown);
            
        })
        
        // avoid text selection
         .bind('selectstart.dc', function(){
           return false;
        }).css({
          MozUserSelect:'none',
          cursor: 'default'
        })
        
        // cancel the click event on the checkboxes because
        // we already switched it's checked state on mousedown 
         .find(':checkbox').bind('click.dc', function(){
           return false;
        }); 
  
        // clear the mdown var if the mouse button is released
        // anywhere on the page
        $(document).bind('mouseup.dc', function(){ 
          mdown = null;
        });
  
      });
   
  }; 