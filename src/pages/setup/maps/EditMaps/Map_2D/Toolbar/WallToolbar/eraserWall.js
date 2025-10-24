import * as THREE from 'three';

class EraserWall {
    constructor(scene, camera, renderer, mapMesh, mapInfo) {
        this.scene = scene;
        this.camera = camera; 
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;

        // lưu giá trị bản đồ trước khi xóa
        if (this.mapMesh && this.mapMesh.material.map) {
            const originalTexture = this.mapMesh.material.map;
            const originalData = originalTexture.image.data;
            
            // Create a backup of the texture data
            this.mapBackup = {
                material: {
                    map: {
                        image: {
                            data: new Uint8Array(originalData)
                        }
                    }
                }
            };
        }

        // Eraser state
        this.state = {
            isErasing: false,
            eraserRadius: 0.2,
            eraserPreviewMesh: null
        };

        // set cursor to crosshair
        this.renderer.domElement.style.cursor = 'crosshair';
    }

    // Set eraser radius
    setEraserRadius(radius) {
        this.state.eraserRadius = radius;
        if (this.state.eraserPreviewMesh) {
            this.state.eraserPreviewMesh.geometry.dispose();
            this.state.eraserPreviewMesh.geometry = new THREE.CircleGeometry(this.state.eraserRadius, 32);
        }
    }

    // Show eraser preview
    showEraserPreview() {
        if (!this.state.eraserPreviewMesh) {
            const eraserGeometry = new THREE.CircleGeometry(this.state.eraserRadius, 32);
            const eraserMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            this.state.eraserPreviewMesh = new THREE.Mesh(eraserGeometry, eraserMaterial);
            this.scene.add(this.state.eraserPreviewMesh);
        }
    }

    // Hide eraser preview
    hideEraserPreview() {
        if (this.state.eraserPreviewMesh) {
            this.scene.remove(this.state.eraserPreviewMesh);
            this.state.eraserPreviewMesh.geometry.dispose();
            this.state.eraserPreviewMesh.material.dispose();
            this.state.eraserPreviewMesh = null;
        }
    }

    // Update eraser position
    updateEraserPosition(clientX, clientY) {
        // Show preview if not exists
        if (!this.state.eraserPreviewMesh) {
            this.showEraserPreview();
        }

        // Convert client coordinates to world coordinates
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (worldPoint) {
            this.state.eraserPreviewMesh.position.set(worldPoint.x, worldPoint.y, 0.1);
        }
    }

    // Start erasing
    startErase(clientX, clientY) {
        this.state.isErasing = true;
        
        if (this.state.eraserPreviewMesh) {
            console.log('eraserMesh already exists');
            this.state.eraserPreviewMesh.material.opacity = 0.5;
        }
        
        // Update position and perform erase
        this.updateEraserPosition(clientX, clientY);
        this.eraseAtPosition(clientX, clientY);
    }

    // Update erasing
    updateErase(clientX, clientY) {
        if (!this.state.isErasing) return;

        // Update eraser circle position
        this.updateEraserPosition(clientX, clientY);

        // Perform erase
        this.eraseAtPosition(clientX, clientY);
    }

    // Stop erasing
    stopErase() {
        this.state.isErasing = false;
        if (this.state.eraserPreviewMesh) {
            this.state.eraserPreviewMesh.material.opacity = 0.3;
        }
    }

    // Erase at specific position
    eraseAtPosition(clientX, clientY) {
        if (!this.mapMesh || !this.mapMesh.material.map) return;

        // Convert client coordinates to world coordinates
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Convert from world coordinates to pixel coordinates in texture
        const worldX = worldPoint.x - this.mapInfo.origin.position.x;
        const worldY = worldPoint.y - this.mapInfo.origin.position.y;

        const pixelX = Math.floor(worldX / this.mapInfo.resolution);
        const pixelY = Math.floor(worldY / this.mapInfo.resolution);

        // Get texture data
        const texture = this.mapMesh.material.map;
        const data = texture.image.data;

        // Determine erase radius in pixels
        const eraseRadius = this.state.eraserRadius / this.mapInfo.resolution;

        // Erase pixels within radius
        for (let y = -Math.ceil(eraseRadius); y <= Math.ceil(eraseRadius); y++) {
            for (let x = -Math.ceil(eraseRadius); x <= Math.ceil(eraseRadius); x++) {
                const currentX = pixelX + x;
                const currentY = pixelY + y;

                // Check if pixel is within radius and map bounds
                if (currentX >= 0 && currentX < this.mapInfo.width &&
                    currentY >= 0 && currentY < this.mapInfo.height) {

                    const distance = Math.sqrt(x * x + y * y);
                    if (distance <= eraseRadius) {
                        const index = (currentY * this.mapInfo.width + currentX) * 4;
                        // Check if pixel is black (0,0,0) then set to white (255,255,255)
                        if (data[index] == 0 && data[index + 1] == 0 && data[index + 2] == 0) {
                            // Set white color (255, 255, 255)
                            data[index] = 255;     // R
                            data[index + 1] = 255; // G
                            data[index + 2] = 255; // B
                            data[index + 3] = 255; // A
                        }
                    }
                }
            }
        }

        // Update texture
        texture.needsUpdate = true;
    }

    // Convert client coordinates to world position
    getWorldPosition(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        if (this.mapMesh) {
            const intersects = raycaster.intersectObject(this.mapMesh);
            if (intersects.length > 0) {
                return intersects[0].point;
            }
        }
        return null;
    }

    // Enable eraser mode
    enable() {
        this.showEraserPreview();
    }

    // Disable eraser mode
    disable() {
        this.hideEraserPreview();
        this.state.isErasing = false;
    }

    // Clear eraser
    clear() {
        this.hideEraserPreview();
        this.state.isErasing = false;
    }

    // Dispose eraser
    dispose() {
        this.clear();
    }


}

export { EraserWall };
