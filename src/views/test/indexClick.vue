<template>
  <div class="test" id="test"></div>
</template>

<script>
import * as THREE from "three";
import * as dat from "dat.gui";
import {onWindowResize} from "./Common/resize";
import {initAll} from "./Init/init";
import {generateFloor} from "./Generate/floor";
import {deleteTag} from "./Common/clean";
import {gsap} from "gsap";

import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";

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

const interaction = {
  raycaster: null,
  mouse: null,
  tag: null,
  object: null,
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

const img = new Image();
img.src = "./images/bubble.png";

const postProcessing = {
  bloomPass: null,
  renderPass: null,
  effectFXAA: null,
  effectCopy: null,
  outlinePass: null,
  composer: null,
  selectedObjects: [],
};

const gui = new dat.GUI();
const clock = new THREE.Clock()

const object = new THREE.Group();

var shaderOne;

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
    let _this = this;
    this.$nextTick(() => {
      window.addEventListener("mousemove", _this.onMouseDbClick, false);
    });
    this.init();
  },
  methods: {
    init() {
      let data = {...baseSceneData};
      initAll(renderers, data, dom, current);
      generateFloor(data);
      this.initRaycaster();
      this.initComposer();
      // this.initShaderOne()
      this.animate();
    },
    animate() {
      this.render();
      requestAnimationFrame(() => {
        let timeDelta = clock.getDelta()
        // shaderOne.material.uniforms.time.value += timeDelta
        this.animate();
      });
    },
    render() {
      // renderers.renderer.render(current.scene, current.camera);
      postProcessing.composer.render();
      renderers.labelRenderer.render(current.scene, current.camera);
    },
    initRaycaster() {
      interaction.raycaster = new THREE.Raycaster();
      interaction.mouse = new THREE.Vector2();
    },
    onMouseDbClick(event) {
      interaction.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      interaction.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      // 根据在屏幕的二维位置以及相机的矩阵更新射线的位置
      interaction.raycaster.setFromCamera(interaction.mouse, current.camera);
      // 获取射线直线和所有模型相交的数组集合
      let intersects = interaction.raycaster.intersectObjects(
          current.scene.children,
          true
      );
      if (intersects.length > 0 && intersects[0].object) {
        this.getJar(intersects);
      }
    },
    getJar(intersects) {
      let object = intersects[0].object;
      // 获取罐子
      // 首先判断是不是直接点击的罐子
      if (object.name && object.parent.name === "jar") {
        this.generate(object, object.name + "号罐子");
        return;
      }

      let isRoot = false;

      while (!isRoot) {
        if (object.parent) {
          if (object.parent.name && object.parent.name === "jar") {
            this.generate(object, object.name + "号罐子");
            isRoot = true;
          } else {
            object = object.parent;
          }
        } else {
          isRoot = true;
        }
      }
    },
    generate(object, text) {
      // 恢复颜色
      if (interaction.object) {
        this.restoreColor(interaction.object);
      }
      // 先删除
      if (interaction.tag) {
        deleteTag(interaction.tag);
      }

      object.traverse(function (obj) {
        if (obj.type === "Mesh") {
          // obj.layers.set(1);
          // obj.material.color = new THREE.Color("#4BFFE8");
          obj.material = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#4BFFE8"),
            transparent: false
          })
          // obj.material.color = new THREE.Color("#4BFFE8");
        }
      });
      this.render();

      // object.layers.set(1);
      interaction.tag = this.initSprite(text);
      interaction.object = object;
      object.add(interaction.tag);
    },
    initSprite(text) {
      let spriteMap = new THREE.CanvasTexture(this.getTextCanvas(text));
      spriteMap.needsUpdate = true;
      let spriteMaterial = new THREE.SpriteMaterial({
        map: spriteMap,
        // transparent: true,
        // opacity: 1,
        // depthTest: false,
        // alphaTest: 0.1
      });
      let sprite = new THREE.Sprite(spriteMaterial);
      sprite.name = "imgSprite";
      sprite.position.z = -1800;
      sprite.scale.set(608, 1072, 1);
      return sprite;
    },
    getTextCanvas(text) {
      let canvas = document.createElement("canvas");
      canvas.width = 304;
      canvas.height = 536;
      let ctx = canvas.getContext("2d");
      // 使用图片
      ctx.drawImage(img, 0, 0, 304, 536);

      ctx.font = "Bold 30px MicrosoftYaHei";
      // ctx.lineWidth = 4;
      ctx.fillStyle = "#E4F7FF";
      ctx.fillText(text, 17, 40);

      ctx.font = "20px MicrosoftYaHei";
      ctx.fillStyle = "#B3EBFF";
      let baseHeight = 120;
      let value = 68;

      let temperature = 23.5;
      let pressure = 10;
      let liquidLevel = 1000;
      let flow = 23.5;
      let opening = 10;
      let temperatureCheck = 100;

      ctx.fillText("温度：" + temperature + "°C", 80, baseHeight + value * 0);
      ctx.fillText("压力：" + pressure + "kpa", 80, baseHeight + value * 1);
      ctx.fillText("液位：" + liquidLevel + "mL", 80, baseHeight + value * 2);
      ctx.fillText("流量：" + flow + "mL", 80, baseHeight + value * 3);
      ctx.fillText("开度：" + opening + "", 80, baseHeight + value * 4);
      ctx.fillText(
          "温度检测：" + temperatureCheck + "",
          80,
          baseHeight + value * 5 - 10
      );
      return canvas;
    },
    initComposer() {
      postProcessing.renderPass = new RenderPass(current.scene, current.camera);
      postProcessing.bloomPass = new UnrealBloomPass(
          {x: 512, y: 512},
          // new THREE.Vector2(dom.offsetWidth, dom.offsetHeight),
          // {x: dom.offsetWidth, y: dom.offsetHeight},
          2,
          0.0,
          0.75
      );

      postProcessing.bloomPass.renderToScreen = true;
      postProcessing.composer = new EffectComposer(renderers.renderer);
      postProcessing.composer.addPass(postProcessing.renderPass);
      postProcessing.composer.addPass(postProcessing.bloomPass);

      // 以下是data.gui 调试代码
      // let building = gui.addFolder("效果");
      let bloomControl = {
        exposure: 1,
        strength: 0.8,
        radius: 0.4,
        threshold: 0.21,
      };
      // gui.add(bloomControl, "exposure", 0.1, 2).name("exposure").onChange(function (value) {
      //   renderers.renderer.toneMappingExposure = Math.pow(value, 4.0);
      // });
      gui
          .add(bloomControl, "strength", 0, 3.0)
          .name("strength")
          .onChange(function (value) {
            if (postProcessing.bloomPass) {
              postProcessing.bloomPass.strength = value;
            }
          });

      gui
          .add(bloomControl, "radius", 0.0, 1.0)
          .name("radius")
          .onChange(function (value) {
            if (postProcessing.bloomPass) {
              postProcessing.bloomPass.radius = value;
            }
          });
      gui
          .add(bloomControl, "threshold", 0.0, 1.0)
          .name("threshold")
          .onChange(function (value) {
            if (postProcessing.bloomPass) {
              postProcessing.bloomPass.threshold = value;
            }
          });
    },
    restoreColor(object) {
      object.traverse(function (obj) {
        if (obj.type === "Mesh") {
          // obj.material.color = new THREE.Color(obj.baseColor);
          obj.material = new THREE.MeshStandardMaterial({color: obj.baseColor, transparent: false})
          // obj.layers.set(0);
        }
      });
      this.render();
    },
    initShaderOne() {
      const vertexShader = `
           varying vec2 vUv;
           void main(){
               vUv = uv;
               gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
           }`;
      const fragmentShader = `
        //http://glslsandbox.com/e#21412
        #ifdef GL_ES
        precision mediump float;
        #endif

        varying vec2 vUv;
        uniform float time;
        // uniform vec2 resolution;

        // rotate position around axis
        vec2 rotate(vec2 p, float a) {
            return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
        }

        // 1D random numbers
        float rand(float n) {
            return fract(sin(n) * 43758.5453123);
        }

        // 2D random numbers
        vec2 rand2(in vec2 p) {
        return fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
        }

        // 1D noise
        float noise1(float p) {
            float fl = floor(p);
            float fc = fract(p);
            return mix(rand(fl), rand(fl + 1.0), fc);
        }

        // voronoi distance noise, based on iq's articles
        float voronoi(in vec2 x) {
            vec2 p = floor(x);
            vec2 f = fract(x);

            vec2 res = vec2(8.0);
            for(int j = -1; j <= 1; j ++) {
                for(int i = -1; i <= 1; i ++) {
                    vec2 b = vec2(i, j);
                    vec2 r = vec2(b) - f + rand2(p + b);

                    // chebyshev distance, one of many ways to do this
                    float d = max(abs(r.x), abs(r.y));

                    if(d < res.x) {
                        res.y = res.x;
                        res.x = d;
                    }
                    else if(d < res.y) {
                        res.y = d;
                    }
                }
            }
            return res.y - res.x;
        }



        void main() {
            float flicker = noise1(time * 2.0) * 0.8 + 0.4;

            // vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec2 uv = vUv;
            uv = (uv - 0.5) * 2.0;
            vec2 suv = uv;
            // uv.x *= resolution.x / resolution.y;


            float v = 0.0;

            // that looks highly interesting:
            //v = 1.0 - length(uv) * 1.3;


            // a bit of camera movement
            //uv *= 0.6 + sin(time * 0.1) * 0.4;
            uv = rotate(uv, sin(0.0 * 0.3) * 1.0);
            //uv += time * 0.4;


            // add some noise octaves
            float a = 0.6, f = 1.0;

            // 4 octaves also look nice, its getting a bit slow though
            for(int i = 0; i < 3; i ++) {
                float v1 = voronoi(uv * f + 5.0);
                float v2 = 0.0;

                // make the moving electrons-effect for higher octaves
                if(i > 0) {
                    // of course everything based on voronoi
                    v2 = voronoi(uv * f * 0.5 + 50.0 + time);

                    float va = 0.0, vb = 0.0;
                    va = 1.0 - smoothstep(0.0, 0.1, v1);
                    vb = 1.0 - smoothstep(0.0, 0.08, v2);
                    v += a * pow(va * (0.5 + vb), 2.0);
                }

                // make sharp edges
                v1 = 1.0 - smoothstep(0.0, 0.3, v1);

                // noise is used as intensity map
                v2 = a * (noise1(v1 * 5.5 + 0.1));

                // octave 0's intensity changes a bit
                if(i == 0)
                v += v2 * flicker;
                else
                v += v2;

                f *= 3.0;
                a *= 0.7;
            }

            // slight vignetting
            v *= exp(-0.6 * length(suv)) * 1.2;

            // use texture channel0 for color? why not.
            //vec3 cexp = texture2D(iChannel0, uv * 0.001).xyz * 3.0 + texture2D(iChannel0, uv * 0.01).xyz;//vec3(1.0, 2.0, 4.0);

            // old blueish color set
            vec3 cexp = vec3(2.0, 2.0, 1.0);
            cexp *= 1.3;

            vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;

            gl_FragColor = vec4(col, 1.0);
        }`

      let uniforms = {
        time: {value: 0},
      };
      let material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        side: 2,
      });
      let geometry = new THREE.PlaneGeometry(10, 10)
      shaderOne = new THREE.Mesh(geometry, material);
      shaderOne.position.set(0, 0, 0)
      current.scene.add(shaderOne)
    },
  },
  beforeDestroy() {
    gui.destroy();
  },

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

.dg {
  position: relative;
  margin-top: 30px;

  input {
    height: 100%;
  }
}
</style>
