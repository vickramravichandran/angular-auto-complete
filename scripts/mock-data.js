var USA_STATES = [
      {
          "name": "ALABAMA",
          "code": "AL"
      },
      {
          "name": "ALASKA",
          "code": "AK"
      },
      {
          "name": "AMERICAN SAMOA",
          "code": "AS"
      },
      {
          "name": "ARIZONA",
          "code": "AZ"
      },
      {
          "name": "ARKANSAS",
          "code": "AR"
      },
      {
          "name": "CALIFORNIA",
          "code": "CA"
      },
      {
          "name": "COLORADO",
          "code": "CO"
      },
      {
          "name": "CONNECTICUT",
          "code": "CT"
      },
      {
          "name": "DELAWARE",
          "code": "DE"
      },
      {
          "name": "DISTRICT OF COLUMBIA",
          "code": "DC"
      },
      {
          "name": "FLORIDA",
          "code": "FL"
      },
      {
          "name": "GEORGIA",
          "code": "GA"
      },
      {
          "name": "GUAM",
          "code": "GU"
      },
      {
          "name": "HAWAII",
          "code": "HI"
      },
      {
          "name": "IDAHO",
          "code": "ID"
      },
      {
          "name": "ILLINOIS",
          "code": "IL"
      },
      {
          "name": "INDIANA",
          "code": "IN"
      },
      {
          "name": "IOWA",
          "code": "IA"
      },
      {
          "name": "KANSAS",
          "code": "KS"
      },
      {
          "name": "KENTUCKY",
          "code": "KY"
      },
      {
          "name": "LOUISIANA",
          "code": "LA"
      },
      {
          "name": "MAINE",
          "code": "ME"
      },
      {
          "name": "MARYLAND",
          "code": "MD"
      },
      {
          "name": "MASSACHUSETTS",
          "code": "MA"
      },
      {
          "name": "MICHIGAN",
          "code": "MI"
      },
      {
          "name": "MINNESOTA",
          "code": "MN"
      },
      {
          "name": "MISSISSIPPI",
          "code": "MS"
      },
      {
          "name": "MISSOURI",
          "code": "MO"
      },
      {
          "name": "MONTANA",
          "code": "MT"
      },
      {
          "name": "NEBRASKA",
          "code": "NE"
      },
      {
          "name": "NEVADA",
          "code": "NV"
      },
      {
          "name": "NEW HAMPSHIRE",
          "code": "NH"
      },
      {
          "name": "NEW JERSEY",
          "code": "NJ"
      },
      {
          "name": "NEW MEXICO",
          "code": "NM"
      },
      {
          "name": "NEW YORK",
          "code": "NY"
      },
      {
          "name": "NORTH CAROLINA",
          "code": "NC"
      },
      {
          "name": "NORTH DAKOTA",
          "code": "ND"
      },
      {
          "name": "OHIO",
          "code": "OH"
      },
      {
          "name": "OKLAHOMA",
          "code": "OK"
      },
      {
          "name": "OREGON",
          "code": "OR"
      },
      {
          "name": "PALAU",
          "code": "PW"
      },
      {
          "name": "PENNSYLVANIA",
          "code": "PA"
      },
      {
          "name": "PUERTO RICO",
          "code": "PR"
      },
      {
          "name": "RHODE ISLAND",
          "code": "RI"
      },
      {
          "name": "SOUTH CAROLINA",
          "code": "SC"
      },
      {
          "name": "SOUTH DAKOTA",
          "code": "SD"
      },
      {
          "name": "TENNESSEE",
          "code": "TN"
      },
      {
          "name": "TEXAS",
          "code": "TX"
      },
      {
          "name": "UTAH",
          "code": "UT"
      },
      {
          "name": "VERMONT",
          "code": "VT"
      },
      {
          "name": "VIRGIN ISLANDS",
          "code": "VI"
      },
      {
          "name": "VIRGINIA",
          "code": "VA"
      },
      {
          "name": "WASHINGTON",
          "code": "WA"
      },
      {
          "name": "WEST VIRGINIA",
          "code": "WV"
      },
      {
          "name": "WISCONSIN",
          "code": "WI"
      },
      {
          "name": "WYOMING",
          "code": "WY"
      }
];

var CSS_COLORS =
[{ "name": "ANTIQUEWHITE", "code": "#faebd7" }, { "name": "AQUA", "code": "#00ffff" }, { "name": "AQUAMARINE", "code": "#7fffd4" }, { "name": "BEIGE", "code": "#f5f5dc" }, { "name": "BISQUE", "code": "#ffe4c4" }, { "name": "BLACK", "code": "#000000" }, { "name": "BLANCHEDALMOND", "code": "#ffebcd" }, { "name": "BLUE", "code": "#0000ff" }, { "name": "BLUEVIOLET", "code": "#8a2be2" }, { "name": "BROWN", "code": "#a52a2a" }, { "name": "BURLYWOOD", "code": "#deb887" }, { "name": "CADETBLUE", "code": "#5f9ea0" }, { "name": "CHARTREUSE", "code": "#7fff00" }, { "name": "CHOCOLATE", "code": "#d2691e" }, { "name": "CORAL", "code": "#ff7f50" }, { "name": "CORNSILK", "code": "#fff8dc" }, { "name": "CRIMSON", "code": "#dc143c" }, { "name": "CYAN", "code": "#00ffff" }, { "name": "DARKBLUE", "code": "#00008b" }, { "name": "DARKCYAN", "code": "#008b8b" }, { "name": "DARKGRAY", "code": "#a9a9a9" }, { "name": "DARKGREEN", "code": "#006400" }, { "name": "DARKGREY", "code": "#a9a9a9" }, { "name": "DARKKHAKI", "code": "#bdb76b" }, { "name": "DARKRED", "code": "#8b0000" }, { "name": "DARKVIOLET", "code": "#9400d3" }, { "name": "DEEPPINK", "code": "#ff1493" }, { "name": "DEEPSKYBLUE", "code": "#00bfff" }, { "name": "DIMGRAY", "code": "#696969" }, { "name": "DIMGREY", "code": "#696969" }, { "name": "DODGERBLUE", "code": "#1e90ff" }, { "name": "FIREBRICK", "code": "#b22222" }, { "name": "FLORALWHITE", "code": "#fffaf0" }, { "name": "FORESTGREEN", "code": "#228b22" }, { "name": "FUCHSIA", "code": "#ff00ff" }, { "name": "GAINSBORO", "code": "#dcdcdc" }, { "name": "GHOSTWHITE", "code": "#f8f8ff" }, { "name": "GOLD", "code": "#ffd700" }, { "name": "GOLDENROD", "code": "#daa520" }, { "name": "GRAY", "code": "#808080" }, { "name": "GREEN", "code": "#008000" }, { "name": "GREENYELLOW", "code": "#adff2f" }, { "name": "GREY", "code": "#808080" }, { "name": "HONEYDEW", "code": "#f0fff0" }, { "name": "HOTPINK", "code": "#ff69b4" }, { "name": "INDIANRED", "code": "#cd5c5c" }, { "name": "INDIGO", "code": "#4b0082" }, { "name": "IVORY", "code": "#fffff0" }, { "name": "KHAKI", "code": "#f0e68c" }, { "name": "LAVENDER", "code": "#e6e6fa" }, { "name": "LAWNGREEN", "code": "#7cfc00" }, { "name": "LIGHTBLUE", "code": "#add8e6" }, { "name": "LIGHTCORAL", "code": "#f08080" }, { "name": "LIGHTCYAN", "code": "#e0ffff" }, { "name": "LIGHTGRAY", "code": "#d3d3d3" }, { "name": "LIGHTGREEN", "code": "#90ee90" }, { "name": "LIGHTGREY", "code": "#d3d3d3" }, { "name": "LIGHTPINK", "code": "#ffb6c1" }, { "name": "LIGHTYELLOW", "code": "#ffffe0" }, { "name": "LIME", "code": "#00ff00" }, { "name": "LIMEGREEN", "code": "#32cd32" }, { "name": "MAGENTA", "code": "#ff00ff" }, { "name": "MAROON", "code": "#800000" }, { "name": "MEDIUMBLUE", "code": "#0000cd" }, { "name": "MIDNIGHTBLUE", "code": "#191970" }, { "name": "MINTCREAM", "code": "#f5fffa" }, { "name": "MISTYROSE", "code": "#ffe4e1" }, { "name": "MOCCASIN", "code": "#ffe4b5" }, { "name": "NAVY", "code": "#000080" }, { "name": "OLDLACE", "code": "#fdf5e6" }, { "name": "OLIVE", "code": "#808000" }, { "name": "OLIVEDRAB", "code": "#6b8e23" }, { "name": "ORANGE", "code": "#ffa500" }, { "name": "ORANGERED", "code": "#ff4500" }, { "name": "ORCHID", "code": "#da70d6" }, { "name": "PAPAYAWHIP", "code": "#ffefd5" }, { "name": "PEACHPUFF", "code": "#ffdab9" }, { "name": "PERU", "code": "#cd853f" }, { "name": "PINK", "code": "#ffc0cb" }, { "name": "PLUM", "code": "#dda0dd" }, { "name": "POWDERBLUE", "code": "#b0e0e6" }, { "name": "PURPLE", "code": "#800080" }, { "name": "RED", "code": "#ff0000" }, { "name": "ROSYBROWN", "code": "#bc8f8f" }, { "name": "ROYALBLUE", "code": "#4169e1" }, { "name": "SADDLEBROWN", "code": "#8b4513" }, { "name": "SALMON", "code": "#fa8072" }, { "name": "SANDYBROWN", "code": "#f4a460" }, { "name": "SEAGREEN", "code": "#2e8b57" }, { "name": "SEASHELL", "code": "#fff5ee" }, { "name": "SIENNA", "code": "#a0522d" }, { "name": "SILVER", "code": "#c0c0c0" }, { "name": "SKYBLUE", "code": "#87ceeb" }, { "name": "SLATEBLUE", "code": "#6a5acd" }, { "name": "SLATEGRAY", "code": "#708090" }, { "name": "SLATEGREY", "code": "#708090" }, { "name": "SNOW", "code": "#fffafa" }, { "name": "SPRINGGREEN", "code": "#00ff7f" }, { "name": "STEELBLUE", "code": "#4682b4" }, { "name": "TAN", "code": "#d2b48c" }, { "name": "TEAL", "code": "#008080" }, { "name": "THISTLE", "code": "#d8bfd8" }, { "name": "TOMATO", "code": "#ff6347" }, { "name": "TURQUOISE", "code": "#40e0d0" }, { "name": "VIOLET", "code": "#ee82ee" }, { "name": "WHEAT", "code": "#f5deb3" }, { "name": "WHITE", "code": "#ffffff" }, { "name": "WHITESMOKE", "code": "#f5f5f5" }, { "name": "YELLOW", "code": "#ffff00" }, { "name": "YELLOWGREEN", "code": "#9acd32" }];