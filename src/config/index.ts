import alignBottomIcon from '../assets/icon/align-bottom.svg';
import alignCenterIcon from '../assets/icon/align-center.svg';
import alignLeftIcon from '../assets/icon/align-left.svg';
import alignMiddleIcon from '../assets/icon/align-middle.svg';
import alignJustifyIcon from '../assets/icon/align-justify.svg';
import alignRightIcon from '../assets/icon/align-right.svg';
import alignTopIcon from '../assets/icon/align-top.svg';

function getCellProperties() {
  return {
    title: 'Cell properties',
    properties: [
      {
        content: 'Border',
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: '',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
            handler: () => {}
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: '',
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
            propertyName: 'border-color',
            value: '',
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
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'height',
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Height'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'padding',
            value: '',
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
            value: '',
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
            value: '',
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

function getTableProperties() {
  return {
    title: 'Table properties',
    properties: [
      {
        content: 'Border',
        children: [
          {
            category: 'dropdown',
            propertyName: 'border-style',
            value: '',
            options: ['dashed', 'dotted', 'double', 'groove', 'inset', 'none', 'outset', 'ridge', 'solid'],
            handler: () => {}
          },
          {
            category: 'color',
            propertyName: 'border-color',
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Color'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'border-width',
            value: '',
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
            propertyName: 'border-color',
            value: '',
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
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Width'
            },
            handler: () => {}
          },
          {
            category: 'input',
            propertyName: 'height',
            value: '',
            attribute: {
              type: 'text',
              placeholder: 'Height'
            },
            handler: () => {}
          },
          {
            category: 'menus',
            propertyName: 'align',
            value: '',
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

function getProperties(type: string) {
  if (type === 'table') return getTableProperties();
  return getCellProperties();
}

export {
  getProperties
};