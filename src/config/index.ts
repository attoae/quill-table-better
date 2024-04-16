import alignBottomIcon from '../assets/icon/align-bottom.svg';
import alignCenterIcon from '../assets/icon/align-center.svg';
import alignLeftIcon from '../assets/icon/align-left.svg';
import alignMiddleIcon from '../assets/icon/align-middle.svg';
import alignJustifyIcon from '../assets/icon/align-justify.svg';
import alignRightIcon from '../assets/icon/align-right.svg';
import alignTopIcon from '../assets/icon/align-top.svg';
import { convertUnitToInteger } from '../utils';

interface Attribute {
  [propName: string]: string
}

interface Options {
  type: string
  attribute: Attribute
}

const cellProperties = [
  'border-style',
  'border-color',
  'border-width',
  'background-color',
  'width',
  'height',
  'padding',
  'text-align',
  'vertical-align'
];

const colors = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'currentcolor',
  'currentcolor',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'transparent',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen'
];

const tableProperties = [
  'border-style',
  'border-color',
  'border-width',
  'background-color',
  'width',
  'height',
  'align'
];

function getCellProperties(attribute: Attribute) {
  return {
    title: 'Cell properties',
    properties: [
      {
        content: 'Border',
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: attribute['border-style'] || 'none',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
            handler: () => {}
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: attribute['border-color'] || '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: convertUnitToInteger(attribute['border-width']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          }
        ]
      },
      {
        content: 'Background',
        children: [
          {
            category: 'color',
            propertyName: 'background-color',
            value: attribute['background-color'] || '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          }
        ]
      },
      {
        content: 'Dimensions',
        children: [
          {
            category: 'input',
            propertyName: 'width',
            value: convertUnitToInteger(attribute['width']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'height',
            value: convertUnitToInteger(attribute['height']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Height'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'padding',
            value: convertUnitToInteger(attribute['padding']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Padding'
            },
            handler: () => {}
          }
        ]
      },
      {
        content: 'Table cell text alignment',
        children: [
          {
            category: 'menus',
            propertyName: 'text-align',
            value: attribute['text-align'] || 'center',
            menus: [
              { icon: alignLeftIcon, describe: 'Align cell text to the left', align: 'left' },
              { icon: alignCenterIcon, describe: 'Align cell text to the center', align: 'center' },
              { icon: alignRightIcon, describe: 'Align cell text to the right', align: 'right' },
              { icon: alignJustifyIcon, describe: 'Justify cell text', align: 'right' }
            ],
            handler: () => {}
          },
          {
            category: 'menus',
            propertyName: 'vertical-align',
            value: attribute['vertical-align'] || 'middle',
            menus: [
              { icon: alignTopIcon, describe: 'Align cell text to the top', align: 'top' },
              { icon: alignMiddleIcon, describe: 'Align cell text to the middle', align: 'middle' },
              { icon: alignBottomIcon, describe: 'Align cell text to the bottom', align: 'bottom' },
            ],
            handler: () => {}
          }
        ]
      }
    ]
  };
}

function getTableProperties(attribute: Attribute) {
  return {
    title: 'Table properties',
    properties: [
      {
        content: 'Border',
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: attribute['border-style'] || 'none',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
            handler: () => {}
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: attribute['border-color'] || '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: convertUnitToInteger(attribute['border-width']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          }
        ]
      },
      {
        content: 'Background',
        children: [
          {
            category: 'color',
            propertyName: 'background-color',
            value: attribute['background-color'] || '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          }
        ]
      },
      {
        content: 'Dimensions and alignment',
        children: [
          {
            category: 'input',
            propertyName: 'width',
            value: convertUnitToInteger(attribute['width']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'height',
            value: convertUnitToInteger(attribute['height']) || '',
            attribute: {
              type: 'text',
              placeholder: 'Height'
            },
            handler: () => {}
          },
          {
            category: 'menus',
            propertyName: 'align',
            value: attribute['align'] || '',
            menus: [
              { icon: alignLeftIcon, describe: 'Align table to the left', align: 'left' },
              { icon: alignCenterIcon, describe: 'Center table', align: 'center' },
              { icon: alignRightIcon, describe: 'Align table to the right', align: 'right' }
            ],
            handler: () => {}
          }
        ]
      }
    ]
  };
}

function getProperties({ type, attribute }: Options) {
  if (type === 'table') return getTableProperties(attribute);
  return getCellProperties(attribute);
}

export {
  cellProperties,
  colors,
  tableProperties,
  getProperties
};