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
// const helper = new THREE.PlaneHelper( plane, 10, 0xffff00 );

var raycaster = new THREE.Raycaster();
var intersection = new THREE.Vector3();
var offset = new THREE.Vector3();
var normalMatrix = new THREE.Matrix3();
var worldPosition = new THREE.Vector3();
var mesh
var lineS
var dragAxis = ''
var isPlus = false
var click = false


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
      // 监听鼠标按下事件
      dom.addEventListener("mousedown", this.onDocumentMouseDown);

      // 监听鼠标移动事件
      dom.addEventListener("mousemove", this.onDocumentMouseMove);

      // 监听鼠标移动事件
      dom.addEventListener("mouseup", this.onDocumentMouseUp);
    });
    this.init();
  },
  methods: {
    init() {
      let data = {...baseSceneData};
      initAll(renderers, data, dom, current);
      // current.scene.add( helper );
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
        click = true
        current.orbitControls.enabled = false

        //这里由于射线获取的第一个可能不是mesh，所以这里find一下
        let meshObject = intersects.find(item => {
          return item.face !== null
        })
        if(!meshObject) {
          return
        }
        // selectedObject = intersects[0].object;
        selectedObject = meshObject.object;
        raycaster.ray.intersectPlane(plane, intersection);

        // 计算拖拽方向向量
        const startDragPosition = new THREE.Vector3();
        const endDragPosition = new THREE.Vector3(mouse.x, intersection.y, intersection.z);
        const dragDirection = new THREE.Vector3();
        dragDirection.subVectors(endDragPosition, startDragPosition).normalize();
        console.log(intersects,'看看')

        // 判断拖拽轴向

        // normalMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld);
        // const worldNormal = intersects[0].face.normal.clone().applyMatrix3(normalMatrix).normalize();
        normalMatrix = new THREE.Matrix3().getNormalMatrix(meshObject.object.matrixWorld);
        const worldNormal = meshObject.face.normal.clone().applyMatrix3(normalMatrix).normalize();


        const dotProduct = dragDirection.dot(worldNormal);

        if (dotProduct > 0) {
          // 拖拽方向朝着物体的正向
          if (Math.abs(worldNormal.x) > Math.abs(worldNormal.y) && Math.abs(worldNormal.x) > Math.abs(worldNormal.z)) {
            dragAxis = 'x'
            isPlus = dragDirection.x > 0 ? true : false;
          } else if (Math.abs(worldNormal.z) > Math.abs(worldNormal.y) && Math.abs(worldNormal.z) > Math.abs(worldNormal.x)) {
            dragAxis = 'z'
            isPlus = dragDirection.z > 0  ? true : false;
          } else {
            dragAxis = 'y'
            isPlus = dragDirection.y > 0 ?  true : false;
          }
        } else if (dotProduct < 0) {
          // 拖拽方向朝着物体的负向
          if (Math.abs(worldNormal.x) > Math.abs(worldNormal.y) && Math.abs(worldNormal.x) > Math.abs(worldNormal.z)) {
            dragAxis = 'x'
            isPlus = dragDirection.x > 0 ? false : true;
          } else if (Math.abs(worldNormal.z) > Math.abs(worldNormal.y) && Math.abs(worldNormal.z) > Math.abs(worldNormal.x)) {
            dragAxis = 'z'
            isPlus = dragDirection.z > 0 ? false : true;
          } else {
            dragAxis = 'y'
            isPlus = dragDirection.y > 0 ? false : true;
          }
        } else {
          // 拖拽方向与物体法线垂直，无法确定拖拽方向
          dragAxis = null;
        }

        console.log(dragAxis)
        console.log(isPlus)

        plane.normal.applyMatrix3(normalMatrix).normalize();
        offset.copy(intersection).sub(worldPosition.setFromMatrixPosition(selectedObject.matrixWorld));
        plane.setFromNormalAndCoplanarPoint(plane.normal, intersection);
      }
    },
    onDocumentMouseMove(event) {
      event.preventDefault();

      if (selectedObject && click) {

        // 将屏幕坐标转换为threejs中的坐标
        let mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        // 射线拾取
        raycaster.setFromCamera(mouse, current.camera);
        // 计算射线与平面的交点
        raycaster.ray.intersectPlane(plane, intersection);
        console.log(intersection,'我是交点')

        //
        // const position = mesh.geometry.attributes.position;
        //
        // if (dragAxis === 'x') {
        //   if (isPlus) {
        //     for (let i = 0; i < position.count; i++) {
        //       const x = position.getX(i);
        //       if (x >= 0) {
        //         position.setX(i, x * 1.02);
        //       }
        //     }
        //   } else {
        //     for (let i = 0; i < position.count; i++) {
        //       const x = position.getX(i);
        //       if (x < 0) {
        //         position.setX(i, x * 1.02);
        //       }
        //     }
        //   }
        //
        // } else if (dragAxis === 'y') {
        //   if (isPlus) {
        //     for (let i = 0; i < position.count; i++) {
        //       const y = position.getY(i);
        //       if (y >= 0) {
        //         position.setY(i, y * 1.02);
        //       }
        //     }
        //   } else {
        //     for (let i = 0; i < position.count; i++) {
        //       const y = position.getY(i);
        //       if (y < 0) {
        //         position.setY(i, y * 1.02);
        //       }
        //     }
        //   }
        // } else if (dragAxis === 'z') {
        //   if (isPlus) {
        //     for (let i = 0; i < position.count; i++) {
        //       const z = position.getZ(i);
        //       if (z >= 0) {
        //         position.setZ(i, z * 1.02);
        //       }
        //     }
        //   } else {
        //     for (let i = 0; i < position.count; i++) {
        //       const z = position.getZ(i);
        //       if (z < 0) {
        //         position.setZ(i, z * 1.02);
        //       }
        //     }
        //   }
        // }
        // console.log(intersection,'我是什么')

        const position = mesh.geometry.attributes.position;
        const axisIndex = ['x', 'y', 'z'].indexOf(dragAxis);
        const isNegative = !isPlus;

        for (let i = 0; i < position.count; i++) {
          const value = position.array[i * 3 + axisIndex];

          if ((isPlus && value >= 0) || (isNegative && value < 0)) {
            position.array[i * 3 + axisIndex] *= 1.02;
            // position.array[i * 3 + axisIndex] = intersection[axisIndex];
          }
        }

        position.needsUpdate = true;


        mesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.index.needsUpdate = true;
        // 更新几何体的顶点和面
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
        mesh.geometry.computeVertexNormals();
        this.refreshLine()
      }
    },
    refreshLine(){
      const position = lineS.geometry.attributes.position;
      const axisIndex = ['x', 'y', 'z'].indexOf(dragAxis);
      const isNegative = !isPlus;

      for (let i = 0; i < position.count; i++) {
        const value = position.array[i * 3 + axisIndex];

        if ((isPlus && value >= 0) || (isNegative && value < 0)) {
          position.array[i * 3 + axisIndex] *= 1.02;
          // position.array[i * 3 + axisIndex] = intersection[axisIndex];
        }
      }

      position.needsUpdate = true;


      lineS.geometry.attributes.position.needsUpdate = true;
      // lineS.geometry.index.needsUpdate = true;
      // 更新几何体的顶点和面
      lineS.geometry.computeBoundingBox();
      lineS.geometry.computeBoundingSphere();
      lineS.geometry.computeVertexNormals();
    },
    onDocumentMouseUp(event) {
      event.preventDefault();
      click = false
      current.orbitControls.enabled = true
    },
    initBox() {
      // 创建盒子
      let geometry = new THREE.BoxGeometry(1, 1, 1);
      let material = new THREE.MeshStandardMaterial({color: 0xff0000});
      mesh = new THREE.Mesh(geometry, material);
      mesh.name = "box";
      current.scene.add(mesh);

      const lineMaterial = new THREE.LineBasicMaterial({
        // 线的颜色
        color: "#000",
        transparent: true,
        opacity: .5,
        depthTest: false,
        alphaTest: .1,
      });

      let edges = new THREE.EdgesGeometry(mesh.geometry, 1);
      lineS = new THREE.LineSegments(edges, lineMaterial);
      current.scene.add(lineS);
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
