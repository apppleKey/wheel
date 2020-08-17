import Vue from 'Vue'
import dialog from './dialog.vue'
import dia_login from './dia_login.vue'
var Components = {
  dialog, //弹框示例
  dia_login
}
var zIndex = 3000;
var dialogs = []
export default (ComponentName, props) => {

  var Component = Components[ComponentName];
  if (!Comment) {
    console.error(`${ComponentName}弹框组件不存在`);
    return
  };
  return new Promise((resolve, reject) => {
    zIndex++;
    //创建组件实例
    const vm = new Vue({
      render(h) {
        return h(Component, {
          props:{...props,zIndex}
        })
      }
    }).$mount();
    //通过$children
    const comp = vm.$children[0];
    document.body.appendChild(vm.$el)
    comp.resolve = resolve;
    comp.reject = reject;
    comp.remove = () => {
      document.body.removeChild(vm.$el)
      vm.$destroy();
    }
  });



}
//    this.$dialog('dialog',{title:'测试弹框'})
 //      .then((_) => {
 //      console.log(_ || "isok");
//    })
//   .then((_) => console.log(_ || "cancel"));
