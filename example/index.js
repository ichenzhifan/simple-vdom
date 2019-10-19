import {createElement, render} from '../src';

const vdom1 = createElement('div', {
  id: 'box'
}, [
  createElement('p', {key: 1, style: {color: 'red'}}, 'text1'),
  createElement('p', {key: 2, class: 'item'}, 'text2'),
  createElement('p', {key: 3, '@click': () => alert('haha')}, 'text3'),
  createElement('p', {key: 4}, 'text4')
]);

const vdom2 = createElement('div', {
  id: 'box'
}, [
 
  createElement('p', {key: 2, class: 'item'}, 'text2'),
  createElement('p', {key: 3, '@click': () => alert('333')}, 'text3'),
  createElement('p', {key: 4}, 'text4'),
  createElement('p', {key: 1, style: {color: 'green'}}, 'text1'),
  createElement('p', {key: 5, class: 'item-2'}, 'text5'),
]);

render(vdom1, document.getElementById('app'));

setTimeout(() => {
  render(vdom2, document.getElementById('app'));
}, 1000);