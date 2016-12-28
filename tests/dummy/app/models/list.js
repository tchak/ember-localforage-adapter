import DS from 'ember-data';

var attr = DS.attr;
var hasMany = DS.hasMany;

export default DS.Model.extend({
  name: attr(),
  b: attr('boolean'),
  items: hasMany('item'),
  day: attr('day')
});
