import alignBottomIcon from '../assets/icon/align-bottom.svg';
import alignCenterIcon from '../assets/icon/align-center.svg';
import alignLeftIcon from '../assets/icon/align-left.svg';
import alignMiddleIcon from '../assets/icon/align-middle.svg';
import alignJustifyIcon from '../assets/icon/align-justify.svg';
import alignRightIcon from '../assets/icon/align-right.svg';
import alignTopIcon from '../assets/icon/align-top.svg';
import { convertUnitToInteger, isValidColor, isValidDimensions } from '../utils';

interface Options {
  type: string
  attribute: Props
}

const cellDefaultValues: Props = {
  'border-style': 'none',
  'border-color': '',
  'border-width': '',
  'background-color': '',
  'width': '',
  'height': '',
  'padding': '',
  'text-align': 'center',
  'vertical-align': 'middle'
};

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

function getCellProperties(attribute: Props, useLanguage: _useLanguage) {
  return {
    title: useLanguage('cellProps'),
    properties: [
      {
        content: useLanguage('border'),
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: attribute['border-style'] || 'none',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: attribute['border-color'] || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('color')
            },
            valid: isValidColor,
            message: useLanguage('colorMsg')
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: convertUnitToInteger(attribute['border-width']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('width')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          }
        ]
      },
      {
        content: useLanguage('background'),
        children: [
          {
            category: 'color',
            propertyName: 'background-color',
            value: attribute['background-color'] || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('color')
            },
            valid: isValidColor,
            message: useLanguage('colorMsg')
          }
        ]
      },
      {
        content: useLanguage('dims'),
        children: [
          {
            category: 'input',
            propertyName: 'width',
            value: convertUnitToInteger(attribute['width']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('width')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          },
          {
            category: 'input',
            propertyName: 'height',
            value: convertUnitToInteger(attribute['height']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('height')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          },
          {
            category: 'input',
            propertyName: 'padding',
            value: convertUnitToInteger(attribute['padding']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('padding')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          }
        ]
      },
      {
        content: useLanguage('tblCellTxtAlm'),
        children: [
          {
            category: 'menus',
            propertyName: 'text-align',
            value: attribute['text-align'] || 'center',
            menus: [
              { icon: alignLeftIcon, describe: useLanguage('alCellTxtL'), align: 'left' },
              { icon: alignCenterIcon, describe: useLanguage('alCellTxtC'), align: 'center' },
              { icon: alignRightIcon, describe: useLanguage('alCellTxtR'), align: 'right' },
              { icon: alignJustifyIcon, describe: useLanguage('jusfCellTxt'), align: 'justify' }
            ]
          },
          {
            category: 'menus',
            propertyName: 'vertical-align',
            value: attribute['vertical-align'] || 'middle',
            menus: [
              { icon: alignTopIcon, describe: useLanguage('alCellTxtT'), align: 'top' },
              { icon: alignMiddleIcon, describe: useLanguage('alCellTxtM'), align: 'middle' },
              { icon: alignBottomIcon, describe: useLanguage('alCellTxtB'), align: 'bottom' },
            ]
          }
        ]
      }
    ]
  };
}

function getTableProperties(attribute: Props, useLanguage: _useLanguage) {
  return {
    title: useLanguage('tblProps'),
    properties: [
      {
        content: useLanguage('border'),
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: attribute['border-style'] || 'none',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: attribute['border-color'] || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('color')
            },
            valid: isValidColor,
            message: useLanguage('colorMsg')
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: convertUnitToInteger(attribute['border-width']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('width')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          }
        ]
      },
      {
        content: useLanguage('background'),
        children: [
          {
            category: 'color',
            propertyName: 'background-color',
            value: attribute['background-color'] || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('color')
            },
            valid: isValidColor,
            message: useLanguage('colorMsg')
          }
        ]
      },
      {
        content: useLanguage('dimsAlm'),
        children: [
          {
            category: 'input',
            propertyName: 'width',
            value: convertUnitToInteger(attribute['width']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('width')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          },
          {
            category: 'input',
            propertyName: 'height',
            value: convertUnitToInteger(attribute['height']) || '',
            attribute: {
              type: 'text',
              placeholder: useLanguage('height')
            },
            valid: isValidDimensions,
            message: useLanguage('dimsMsg')
          },
          {
            category: 'menus',
            propertyName: 'align',
            value: attribute['align'] || '',
            menus: [
              { icon: alignLeftIcon, describe: useLanguage('alTblL'), align: 'left' },
              { icon: alignCenterIcon, describe: useLanguage('tblC'), align: 'center' },
              { icon: alignRightIcon, describe: useLanguage('alTblR'), align: 'right' }
            ]
          }
        ]
      }
    ]
  };
}

function getProperties({ type, attribute }: Options, useLanguage: _useLanguage) {
  if (type === 'table') return getTableProperties(attribute, useLanguage);
  return getCellProperties(attribute, useLanguage);
}

export {
  cellDefaultValues,
  cellProperties,
  colors,
  tableProperties,
  getProperties
};