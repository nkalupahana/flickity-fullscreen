/*!
 * Flickity fullscreen v1.1.1
 * Enable fullscreen view for Flickity
 */

/*jshint browser: true, undef: true, unused: true, strict: true*/

( function( window, factory ) {
  // universal module definition
  /*jshint strict: false */ /*globals define, module, require */
  if ( typeof define == 'function' && define.amd ) {
    // AMD
    define( [
      'flickity/js/index',
    ], factory );
  } else if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory(
      require('flickity')
    );
  } else {
    // browser global
    factory(
      window.Flickity
    );
  }

}( window, function factory( Flickity ) {

'use strict';

Flickity.createMethods.push('_createFullscreen');
var proto = Flickity.prototype;


proto._createFullscreen = function() {
  this.isFullscreen = false;

  if ( !this.options.fullscreen ) {
    return;
  }
  // buttons
  this.viewFullscreenButton = new FullscreenButton( 'view', this );
  this.exitFullscreenButton = new FullscreenButton( 'exit', this );

  this.on( 'activate', this._changeFullscreenActive );
  this.on( 'deactivate', this._changeFullscreenActive );
};

// ----- activation ----- //

proto._changeFullscreenActive = function() {
  var childMethod = this.isActive ? 'appendChild' : 'removeChild';
  this.element[ childMethod ]( this.viewFullscreenButton.element );
  this.element[ childMethod ]( this.exitFullscreenButton.element );
  // activate or deactivate buttons
  var activeMethod = this.isActive ? 'activate' : 'deactivate';
  this.viewFullscreenButton[ activeMethod ]();
  this.exitFullscreenButton[ activeMethod ]();
};

// ----- view, exit, toggle ----- //

proto.viewFullscreen = function() {
  this._changeFullscreen( true );
  this.focus();
};

proto.exitFullscreen = function() {
  this._changeFullscreen( false );
};

proto._changeFullscreen = async function( isView ) {
  if ( this.isFullscreen == isView ) {
    return;
  }
  // Force onto current slide and wait until it's there
  // Done in order to avoid bugs when fullscreening during animation
  this.select(this.selectedIndex, true, true);
  while (this.isAnimating) {
    await new Promise(r => setTimeout(r, 10));
  }

  this.isFullscreen = isView;
  var classMethod = isView ? 'add' : 'remove';
  document.documentElement.classList[ classMethod ]('is-flickity-fullscreen');
  this.element.classList[ classMethod ]('is-fullscreen');
  this.resize();
  // HACK extra reposition on fullscreen for images
  if ( this.isFullscreen ) {
    this.reposition();
  }

  this.dispatchEvent( 'fullscreenChange', null, [ isView ] );
};

proto.toggleFullscreen = function() {
  this._changeFullscreen( !this.isFullscreen );
};

// ----- setGallerySize ----- //

// overwrite so fullscreen cells are full height
var setGallerySize = proto.setGallerySize;
proto.setGallerySize = function() {
  if ( !this.options.setGallerySize ) {
    return;
  }
  if ( this.isFullscreen ) {
    // remove height style on fullscreen
    this.viewport.style.height = '';
  } else {
    // otherwise, do normal
    setGallerySize.call( this );
  }
};

// ----- keyboard ----- //

// ESC key closes full screen
Flickity.keyboardHandlers[27] = function() {
  this.exitFullscreen();
};

// ----- FullscreenButton ----- //

function FullscreenButton( name, flickity ) {
  this.name = name;
  this.createButton();
  this.createIcon();
  // events
  // trigger viewFullscreen or exitFullscreen on click
  this.onClick = function() {
    flickity[ name + 'Fullscreen' ]();
  };
  this.clickHandler = this.onClick.bind( this );
}

FullscreenButton.prototype.createButton = function() {
  var element = this.element = document.createElement('button');
  element.className = 'flickity-button flickity-fullscreen-button ' +
    'flickity-fullscreen-button-' + this.name;
  // prevent button from submitting form
  element.setAttribute( 'type', 'button' );
  // set label
  var label = capitalize( this.name + ' full-screen' );
  element.setAttribute( 'aria-label', label );
  element.title = label;
};

function capitalize( text ) {
  return text[0].toUpperCase() + text.slice(1);
}

var svgURI = 'http://www.w3.org/2000/svg';

var pathDirections = {
  view: 'M 13 18 L 5 26 h 5 v 1 H 3 V 20 H 4 v 5 l 8 -8 Z m 5 -5 l 8 -8 v 5 h 1 V 3 H 20 V 4 h 5 l -8 8 Z',
  exit: 'M 26 4 L 19 11 h 5 v 1 H 17 V 5 h 1 V 10 l 7 -7 z M 4 26 L 11 19 L 11 24 H 12 L 12 17 L 5 17 V 18 H 10 L 3 25 z',
};

FullscreenButton.prototype.createIcon = function() {
  var svg = document.createElementNS( svgURI, 'svg');
  svg.setAttribute( 'class', 'flickity-button-icon' );
  svg.setAttribute( 'viewBox', '0 0 29 29' );
  // path & direction
  var path = document.createElementNS( svgURI, 'path');
  var direction = pathDirections[ this.name ];
  path.setAttribute( 'd', direction );
  path.setAttribute("stroke", "black");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.5");
  // put it together
  svg.appendChild( path );
  this.element.appendChild( svg );
};

FullscreenButton.prototype.activate = function() {
  this.element.addEventListener( 'click', this.clickHandler );
};

FullscreenButton.prototype.deactivate = function() {
  this.element.removeEventListener( 'click', this.clickHandler );
};

Flickity.FullscreenButton = FullscreenButton;

// ----- fin ----- //

return Flickity;

}));
