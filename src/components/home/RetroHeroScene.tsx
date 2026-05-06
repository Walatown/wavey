'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Renders a small retro-styled surf animation for the home hero card.
export function RetroHeroScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const mountElement = mount;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x09152a, 36, 92);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    camera.position.set(0, 5.4, 19);
    camera.lookAt(0, 2.2, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountElement.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x5e6fa7, 1.9);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffcf67, 2.4);
    keyLight.position.set(7, 11, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x2dc4dd, 1.1);
    rimLight.position.set(-8, 4, -10);
    scene.add(rimLight);

    const sun = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 18),
      new THREE.MeshBasicMaterial({ color: 0xf6e347 })
    );
    sun.position.set(6.8, 8.7, -23);
    scene.add(sun);

    const skyBands = [0x09152a, 0x13264a, 0x7b2c53, 0xc9632d, 0xf6a32f];
    skyBands.forEach((color, index) => {
      const band = new THREE.Mesh(
        new THREE.PlaneGeometry(70, 4.4),
        new THREE.MeshBasicMaterial({ color })
      );
      band.position.set(0, 15 - index * 3.8, -30);
      scene.add(band);
    });

    const grid = new THREE.GridHelper(70, 28, 0x204d7a, 0x204d7a);
    grid.position.y = -1.25;
    scene.add(grid);

    const oceanGeometry = new THREE.PlaneGeometry(68, 44, 16, 12);
    oceanGeometry.rotateX(-Math.PI / 2);
    const oceanPositions = oceanGeometry.attributes.position;

    for (let index = 0; index < oceanPositions.count; index += 1) {
      const x = oceanPositions.getX(index);
      const z = oceanPositions.getZ(index);
      oceanPositions.setY(
        index,
        Math.sin(x * 0.28) * 0.36 +
          Math.sin(z * 0.42) * 0.18 +
          Math.sin((x - z) * 0.18) * 0.12
      );
    }
    oceanGeometry.computeVertexNormals();

    const ocean = new THREE.Mesh(
      oceanGeometry,
      new THREE.MeshPhongMaterial({
        color: 0x1b6eaf,
        shininess: 90,
        specular: 0xa2edff,
        flatShading: true,
      })
    );
    scene.add(ocean);

    function buildWave(color: number, span: number, height: number) {
      const points: THREE.Vector3[] = [];

      for (let index = 0; index <= 26; index += 1) {
        const t = index / 26;
        points.push(new THREE.Vector3((t - 0.5) * span, Math.sin(t * Math.PI) * height, 0));
      }

      const body = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, 0.3, 8, false),
        new THREE.MeshPhongMaterial({
          color,
          shininess: 85,
          transparent: true,
          opacity: 0.92,
        })
      );

      const foamPoints: THREE.Vector3[] = [];

      for (let index = 0; index <= 12; index += 1) {
        const t = index / 12;
        foamPoints.push(
          new THREE.Vector3((t - 0.5) * span * 0.32 + span * 0.25, Math.sin(t * Math.PI) * height * 0.55, 0.14)
        );
      }

      const foam = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(foamPoints), 18, 0.11, 6, false),
        new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.9 })
      );

      const group = new THREE.Group();
      group.add(body, foam);
      return group;
    }

    const waveGroup = new THREE.Group();
    const waveFront = buildWave(0x2dc4dd, 19, 2.2);
    const waveMid = buildWave(0x1b86cf, 22, 1.5);
    waveMid.position.set(0, -0.35, -1.8);
    const waveBack = buildWave(0x155d96, 25, 1.0);
    waveBack.position.set(0, -0.6, -3.8);
    waveGroup.add(waveFront, waveMid, waveBack);
    waveGroup.position.y = 1;
    scene.add(waveGroup);

    function createPalm(offsetX: number, offsetZ: number, lean: number) {
      const palm = new THREE.Group();

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.18, 3.8, 6),
        new THREE.MeshPhongMaterial({ color: 0x8b5d39 })
      );
      trunk.position.y = 1.95;
      trunk.rotation.z = lean;
      palm.add(trunk);

      for (let index = 0; index < 6; index += 1) {
        const angle = (index / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.08, 1.7, 5),
          new THREE.MeshPhongMaterial({ color: 0x2f8f5b })
        );
        leaf.position.set(Math.cos(angle) * 0.8, 3.8, Math.sin(angle) * 0.8);
        leaf.rotation.set(Math.sin(angle) * 0.45, angle, Math.PI / 2 - 0.38);
        palm.add(leaf);
      }

      palm.position.set(offsetX, 0, offsetZ);
      scene.add(palm);
    }

    createPalm(-9.2, -2, 0.14);
    createPalm(10.4, -2.4, -0.12);

    function createSurfer() {
      const surfer = new THREE.Group();

      function block(
        width: number,
        height: number,
        depth: number,
        color: number,
        x: number,
        y: number,
        z: number,
        rotationZ = 0
      ) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          new THREE.MeshPhongMaterial({ color, flatShading: true })
        );
        mesh.position.set(x, y, z);
        mesh.rotation.z = rotationZ;
        surfer.add(mesh);
      }

      block(2.7, 0.11, 0.58, 0xf6e347, 0, 0, 0);
      block(2.7, 0.08, 0.16, 0xff7f50, 0, 0.03, 0);
      block(0.16, 0.5, 0.16, 0x1d6eaf, -0.18, 0.31, 0);
      block(0.16, 0.5, 0.16, 0x1d6eaf, 0.18, 0.31, 0);
      block(0.48, 0.55, 0.28, 0xff7f50, 0, 0.9, 0);
      block(0.34, 0.34, 0.28, 0xf3b57a, 0, 1.3, 0);
      block(0.42, 0.14, 0.32, 0x38200f, 0, 1.5, 0);
      block(0.14, 0.48, 0.14, 0xf3b57a, -0.45, 1.03, 0, Math.PI / 3.5);
      block(0.14, 0.48, 0.14, 0xf3b57a, 0.44, 0.96, 0, -Math.PI / 5);

      surfer.rotation.y = Math.PI;
      scene.add(surfer);
      return surfer;
    }

    const surfer = createSurfer();

    const splashGeometry = new THREE.BufferGeometry();
    const splashCount = 72;
    const splashPositions = new Float32Array(splashCount * 3);
    splashGeometry.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));

    const splash = new THREE.Points(
      splashGeometry,
      new THREE.PointsMaterial({
        color: 0xf4fbff,
        size: 0.12,
        transparent: true,
        opacity: 0.8,
      })
    );
    scene.add(splash);

    const splashVelocity = Array.from({ length: splashCount }, () => ({
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      max: 0,
    }));

    let splashActive = false;
    let splashCooldown = 0;

    function emitSplash(originX: number, originY: number, originZ: number) {
      if (splashActive) {
        return;
      }

      for (let index = 0; index < splashCount; index += 1) {
        splashPositions[index * 3] = originX;
        splashPositions[index * 3 + 1] = originY;
        splashPositions[index * 3 + 2] = originZ;
        splashVelocity[index] = {
          vx: (Math.random() - 0.5) * 0.09,
          vy: Math.random() * 0.11 + 0.03,
          vz: (Math.random() - 0.5) * 0.07,
          life: 0,
          max: 16 + Math.floor(Math.random() * 24),
        };
      }

      splashGeometry.attributes.position.needsUpdate = true;
      splashActive = true;
    }

    function resize() {
      const width = mountElement.clientWidth || 480;
      const height = mountElement.clientHeight || 360;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.elapsedTime;

      waveFront.position.x = Math.sin(time * 0.55) * 0.45;
      waveMid.position.x = Math.sin(time * 0.42 + 1) * 0.35;
      waveBack.position.x = Math.sin(time * 0.3 + 2.2) * 0.2;

      const rideX = Math.sin(time * 0.45) * 5.5 - 1.8;
      surfer.position.set(
        rideX,
        Math.sin(time * 1.1) * 0.18 + 2.35,
        1.15 + Math.sin(time * 1.05) * 0.18
      );
      surfer.rotation.z = Math.sin(time * 1.8) * 0.1 - 0.08;
      surfer.rotation.y = Math.PI + Math.sin(time * 0.7) * 0.04;

      splashCooldown -= delta;
      if (splashCooldown <= 0) {
        emitSplash(surfer.position.x - 0.7, surfer.position.y - 1, surfer.position.z);
        splashCooldown = 0.6;
      }

      if (splashActive) {
        let hasAliveParticles = false;

        for (let index = 0; index < splashCount; index += 1) {
          const particle = splashVelocity[index];

          if (particle.life < particle.max) {
            splashPositions[index * 3] += particle.vx;
            splashPositions[index * 3 + 1] += particle.vy;
            splashPositions[index * 3 + 2] += particle.vz;
            particle.vy -= 0.005;
            particle.life += 1;
            hasAliveParticles = true;
          }
        }

        splashGeometry.attributes.position.needsUpdate = true;
        splashActive = hasAliveParticles;
      }

      camera.lookAt(0, 2.1, 0);
      renderer.render(scene, camera);
    };

    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frameId);
      clock.stop();
      mountElement.removeChild(renderer.domElement);

      splashGeometry.dispose();
      oceanGeometry.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
