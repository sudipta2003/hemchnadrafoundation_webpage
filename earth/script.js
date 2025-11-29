const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    // Calculate camera distance to fit sphere perfectly
    const vFOW = camera.fov * Math.PI / 180; // Convert vertical FOV to radians
    const height = 2 * Math.tan(vFOW / 2) * 2; // Sphere radius is 1, so multiply by 2
    const distance = height / (2 * Math.tan(vFOW / 2));
    const minZoomDistance = distance * 0.85; // Set default to minZoom
    camera.position.z = minZoomDistance;

    // === Earth Setup ===
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
    );

    // === Overlay Canvas (for India + Assam) ===
    const overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = 2048;
    overlayCanvas.height = 1024;
    const overlayCtx = overlayCanvas.getContext("2d");

    const overlayTexture = new THREE.CanvasTexture(overlayCanvas);

    // === Function to Draw India ===
  async function drawIndiaExactShape() {
    const response = await fetch("india.geojson");
    const geoData = await response.json();

    function lonLatToCanvas(lon, lat) {
      const x = ((lon + 180) / 360) * overlayCanvas.width;
      const y = ((90 - lat) / 180) * overlayCanvas.height;
      return { x, y };
    }

    overlayCtx.beginPath();

    geoData.features.forEach((feature) => {
      const geom = feature.geometry;

      if (geom.type === "Polygon") {
        geom.coordinates.forEach((ring) => {
          const first = lonLatToCanvas(ring[0][0], ring[0][1]);
          overlayCtx.moveTo(first.x, first.y);
          for (let i = 1; i < ring.length; i++) {
            const p = lonLatToCanvas(ring[i][0], ring[i][1]);
            overlayCtx.lineTo(p.x, p.y);
          }
          overlayCtx.closePath();
        });
      }

      else if (geom.type === "MultiPolygon") {
        geom.coordinates.forEach((polygon) => {
          polygon.forEach((ring) => {
            const first = lonLatToCanvas(ring[0][0], ring[0][1]);
            overlayCtx.moveTo(first.x, first.y);
            for (let i = 1; i < ring.length; i++) {
              const p = lonLatToCanvas(ring[i][0], ring[i][1]);
              overlayCtx.lineTo(p.x, p.y);
            }
            overlayCtx.closePath();
          });
        });
      }
    });

    overlayCtx.fillStyle = "rgba(255, 0, 0, 1)";
    overlayCtx.fill();
    overlayCtx.strokeStyle = "rgba(25, 27, 27, 1)";
    overlayCtx.lineWidth = 1;
    overlayCtx.stroke();

    overlayTexture.needsUpdate = true;
}

    // === Draw Assam GeoJSON ===
  async function drawAssamFromGeoJSON() {
  const response = await fetch("assam.geojson");
  const geoData = await response.json();

  function lonLatToCanvas(lon, lat) {
    const x = ((lon + 180) / 360) * overlayCanvas.width;
    const y = ((90 - lat) / 180) * overlayCanvas.height;
    return { x, y };
  }

  overlayCtx.beginPath();

  geoData.features.forEach((feature) => {
    const geom = feature.geometry;

    if (geom.type === "Polygon") {
      geom.coordinates.forEach((ring) => {
        const first = lonLatToCanvas(ring[0][0], ring[0][1]);
        overlayCtx.moveTo(first.x, first.y);
        for (let i = 1; i < ring.length; i++) {
          const p = lonLatToCanvas(ring[i][0], ring[i][1]);
          overlayCtx.lineTo(p.x, p.y);
        }
        overlayCtx.closePath();
      });
    }

    else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          const first = lonLatToCanvas(ring[0][0], ring[0][1]);
          overlayCtx.moveTo(first.x, first.y);
          for (let i = 1; i < ring.length; i++) {
            const p = lonLatToCanvas(ring[i][0], ring[i][1]);
            overlayCtx.lineTo(p.x, p.y);
          }
          overlayCtx.closePath();
        });
      });
    }
  });

  overlayCtx.fillStyle = "rgba(0, 255, 242, 1)";
  overlayCtx.fill();
  overlayCtx.strokeStyle = "rgba(0, 255, 242, 1)";
  overlayCtx.lineWidth = 1;
  overlayCtx.stroke();

  overlayTexture.needsUpdate = true;
}

   
    drawAssamFromGeoJSON();
     drawIndiaExactShape();

    // === Earth Materials ===
    const earth = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({ map: earthTexture, shininess: 5 })
    );
    scene.add(earth);

    const overlayMaterial = new THREE.MeshBasicMaterial({
      map: overlayTexture,
      transparent: true,
      opacity: 1,
    });
    const indiaOverlay = new THREE.Mesh(geometry, overlayMaterial);
    scene.add(indiaOverlay);

    // Rotate earth down
    earth.rotation.x = 0.45;
    indiaOverlay.rotation.copy(earth.rotation);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 64, 64),
      new THREE.MeshBasicMaterial({
        color: "#87ceeb",
        transparent: true,
        opacity: 0.3,
      })
    );
    scene.add(atmosphere);

    // === Lighting ===
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // === Controls ===
    let isDragging = false;
    let isHoveringOverEarth = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rotationSpeed = 0.002;

    // Raycaster for detecting hover over earth object
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const baseDistance = minZoomDistance;
    const minZoom = baseDistance * 0.8;
    const maxZoom = minZoomDistance;

    // Detect hover over 3D earth object
    renderer.domElement.addEventListener("mousemove", (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update raycaster
      raycaster.setFromCamera(mouse, camera);

      // Check intersections with earth
      const intersects = raycaster.intersectObjects([earth, indiaOverlay, atmosphere]);
      isHoveringOverEarth = intersects.length > 0;

      if (!isDragging) return;
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      earth.rotation.y += deltaX * 0.01;
      earth.rotation.x += deltaY * 0.01;
      indiaOverlay.rotation.copy(earth.rotation);
      atmosphere.rotation.copy(earth.rotation);
      previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    renderer.domElement.addEventListener("mousedown", (event) => {
      if (isHoveringOverEarth) {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    });

    document.addEventListener("mouseup", () => (isDragging = false));

    renderer.domElement.addEventListener(
      "wheel",
      (e) => {
        if (!isHoveringOverEarth) return;
        e.preventDefault();
        camera.position.z += e.deltaY * 0.002;
        camera.position.z = Math.max(minZoom, Math.min(maxZoom, camera.position.z));
      },
      { passive: false }
    );

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // === Animate ===
    function animate() {
      requestAnimationFrame(animate);
      if (!isDragging) earth.rotation.y += rotationSpeed;
      indiaOverlay.rotation.copy(earth.rotation);
      atmosphere.rotation.copy(earth.rotation);
      renderer.render(scene, camera);
    }

    animate();