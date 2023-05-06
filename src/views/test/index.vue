<template>
  <div class="test" id="test"></div>
</template>

<script>
import * as THREE from "three";
import {onWindowResize} from "./Common/resize";
import {initAll} from "./Init/init";

const renderers = {
  renderer: null,
  labelRenderer: null,
};

const current = {
  scene: null,
  camera: null,
  orbitControls: null,
  data: null,
};

var dom;

// 所有场景List
const baseSceneData = {
  id: null,
  name: null,
  path: "./model/1.glb",
  init: false,
  camera: null,
  control: null,
  scene: null,
  sceneObject: null,
};

// 初始化变量
var selectedObject = null;
var plane = new THREE.Plane();
var raycaster = new THREE.Raycaster();
var intersection = new THREE.Vector3();
var offset = new THREE.Vector3();
var normalMatrix = new THREE.Matrix3();
var worldPosition = new THREE.Vector3();
var mesh
var dragAxis = ''


export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "index",
  data() {
    return {}
  },
  created() {
  },
  mounted() {
    dom = document.querySelector("#test");
    window.onresize = () => {
      onWindowResize(current.camera, renderers.renderer, dom);
    };
    this.$nextTick(() => {
      // window.addEventListener("mousemove", _this.onMouseDbClick, false);
      // window.addEventListener("mousemove", this.onDocumentMouseDown, false);
      // window.addEventListener("mousemove", this.onDocumentMouseMove, false);

      // 监听鼠标按下事件
      window.addEventListener("mousedown", this.onDocumentMouseDown, false);

      // 监听鼠标移动事件
      window.addEventListener("mousemove", this.onDocumentMouseMove, false);
    });
    this.init();
  },
  methods: {
    init() {
      let data = {...baseSceneData};
      initAll(renderers, data, dom, current);
      this.initBox();
      this.animate();
    },
    animate() {
      this.render();
      requestAnimationFrame(() => {
        this.animate();
      });
    },
    render() {
      renderers.renderer.render(current.scene, current.camera);
      renderers.labelRenderer.render(current.scene, current.camera);
    },
    onDocumentMouseDown(event) {
      event.preventDefault();
      let mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, current.camera);
      let intersects = raycaster.intersectObjects(current.scene.children);

      if (intersects.length > 0) {
        selectedObject = intersects[0].object;
        raycaster.ray.intersectPlane(plane, intersection);

        // 计算拖拽方向向量
        const startDragPosition = new THREE.Vector3();
        const endDragPosition = new THREE.Vector3(mouse.x,intersection.y,intersection.z);
        const dragDirection = new THREE.Vector3();
        dragDirection.subVectors(endDragPosition, startDragPosition).normalize();

        // 判断拖拽轴向
        normalMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld);
        const worldNormal = intersects[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();

        const dotProduct = dragDirection.dot(worldNormal);

        if (dotProduct > 0) {
          // 拖拽方向朝着物体的正向
          if (Math.abs(worldNormal.x) > Math.abs(worldNormal.y) && Math.abs(worldNormal.x) > Math.abs(worldNormal.z)) {
            dragAxis = dragDirection.x > 0 ? "x+" : "x-";
          } else if (Math.abs(worldNormal.z) > Math.abs(worldNormal.y) && Math.abs(worldNormal.z) > Math.abs(worldNormal.x)) {
            dragAxis = dragDirection.z > 0 ? "z+" : "z-";
          } else {
            dragAxis = dragDirection.y > 0 ? "y+" : "y-";
          }
        } else if (dotProduct < 0) {
          // 拖拽方向朝着物体的负向
          if (Math.abs(worldNormal.x) > Math.abs(worldNormal.y) && Math.abs(worldNormal.x) > Math.abs(worldNormal.z)) {
            dragAxis = dragDirection.x > 0 ? "x-" : "x+";
          } else if (Math.abs(worldNormal.z) > Math.abs(worldNormal.y) && Math.abs(worldNormal.z) > Math.abs(worldNormal.x)) {
            dragAxis = dragDirection.z > 0 ? "z-" : "z+";
          } else {
            dragAxis = dragDirection.y > 0 ? "y-" : "y+";
          }
        } else {
          // 拖拽方向与物体法线垂直，无法确定拖拽方向
          dragAxis = null;
        }

        console.log(dragAxis)


        // raycaster.ray.intersectPlane(plane, intersection);

        // console.log(intersection,'intersection')
        // normalMatrix.getNormalMatrix(selectedObject.matrixWorld);
        // plane.normal.applyMatrix3(normalMatrix).normalize();
        // offset.copy(intersection).sub(worldPosition.setFromMatrixPosition(selectedObject.matrixWorld));

        // plane.setFromNormalAndCoplanarPoint(plane.normal, intersection);

      }
    },
    onDocumentMouseMove(event) {
      event.preventDefault();

      if (selectedObject) {
        // 将屏幕坐标转换为threejs中的坐标
        let mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        // 射线拾取
        raycaster.setFromCamera(mouse, current.camera);

        // 计算射线与平面的交点
        raycaster.ray.intersectPlane(plane, intersection);

        // // 计算缩放比例
        // let scale = intersection.sub(worldPosition.setFromMatrixPosition(selectedObject.matrixWorld)).dot(plane.normal) / offset.dot(plane.normal);
        //
        // // 计算顶点在模型空间中的位置
        // let position = worldPosition.copy(plane.normal).multiplyScalar(scale).add(offset);
        //
        // // 根据拖动的方向更新顶点位置
        // let vertices = selectedObject.geometry.attributes.normal.array;
        // selectedObject.geometry.computeBoundingBox();
        // let min = selectedObject.geometry.boundingBox.min;
        // let max = selectedObject.geometry.boundingBox.max;
        // // console.log(min,'min')
        // // console.log(max,'max')
        // for (let i = 0; i < vertices.length; i++) {
        //   let vertex = vertices[i];
        //   let direction = new THREE.Vector3().subVectors(vertex, position).normalize();
        //   if (Math.abs(direction.x) > Math.abs(direction.y) && Math.abs(direction.x) > Math.abs(direction.z)) {
        //     if (vertex.x < (min.x + max.x) / 2) {
        //       vertex.x = min.x;
        //     } else {
        //       vertex.x = max.x;
        //     }
        //   }
        //   if (Math.abs(direction.y) > Math.abs(direction.x) && Math.abs(direction.y) > Math.abs(direction.z)) {
        //     if (vertex.y < (min.y + max.y) / 2) {
        //       vertex.y = min.y;
        //     } else {
        //       vertex.y = max.y;
        //     }
        //   }
        //   if (Math.abs(direction.z) > Math.abs(direction.x) && Math.abs(direction.z) > Math.abs(direction.y)) {
        //     if (vertex.z < (min.z + max.z) / 2) {
        //       vertex.z = min.z;
        //     } else {
        //       vertex.z = max.z;
        //     }
        //   }
        // }
        // 标记顶点发生变化
        selectedObject.geometry.verticesNeedUpdate = true;
        selectedObject.geometry.computeBoundingBox();
        selectedObject.geometry.computeBoundingSphere();
      }
    },
    initBox() {
      // 创建盒子
      let geometry = new THREE.BoxGeometry(1, 1, 1);
      let material = new THREE.MeshPhongMaterial({color: 0xff0000});
      mesh = new THREE.Mesh(geometry, material);
      mesh.name = "box";
      current.scene.add(mesh);
    },
  },
  beforeDestroy() {
    // gui.destroy();
  }

}
</script>

<style lang="less">
body {
  margin: 0;
  padding: 0;
}

.test {
  //width: 100vw;
  //height: 100vh;
  width: calc(100vw - 1px);
  height: calc(100vh - 1px);
  background: rgba(66, 58, 184, 0.6);
  overflow: hidden;
  background-color: #070a2b;
  background-image: url("../../assets/background.png");
  background-repeat: no-repeat;
  background-size: 100%;
}
</style>
