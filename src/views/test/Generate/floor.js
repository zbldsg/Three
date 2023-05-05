import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three'

const loader = new GLTFLoader()

export function generateFloor(data) {
  loader.load(data.path, gltf => {
    let plane = gltf.scene.getObjectByName('plane')
    plane.layers.set(0)
    plane.material.transparent = true
    plane.material.opacity = 0.2
    plane.material.depthWrite = false
    // plane.material.depthTest = false
    // plane.material.alphaTest = .1

    let jar = gltf.scene.getObjectByName('jar')
    jar.traverse(function (obj) {
      if (obj.type === "Mesh") {
        obj.baseColor = '#' + obj.material.color.getHexString()
        obj.layers.set(0)
      }
    })

    data.sceneObject = gltf.scene
    data.scene.add(gltf.scene)
  })
}
