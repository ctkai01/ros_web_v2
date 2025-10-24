import * as THREE from 'three';
class DrawWall {
    constructor(scene, camera, renderer, mapMesh, mapInfo) {
        this.scene = scene;
        this.camera = camera; 
        this.renderer = renderer;
        this.mapMesh = mapMesh;
        this.mapInfo = mapInfo;

        // Wall drawing state
        this.state = {
            nodes: [],      // Array of nodes (points)
            points: [],     // Array of point coordinates 
            segments: [],   // Array of wall segments
            selectedNode: null,  // Currently selected node for moving
            nodeRadius: 0.12,    // Node radius
            nodeColors: {
                outer: {
                    normal: 0x000000,   // Normal outline color
                    selected: 0xFF0000  // Selected outline color
                },
                inner: {
                    normal: 0x87f542,   // Normal fill color
                    selected: 0xFF69B4  // Selected fill color
                }
            },
            wallWidth: 4  // Wall width in world units
        };

        // set cursor to crosshair
        this.renderer.domElement.style.cursor = 'crosshair';

        //save map before draw
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


    }


    // set line width
    setLineWidth(width) {
        this.state.wallWidth = width;
        // update line width
        this.updateLineWidth(width);
    }

    // reset selected node
    resetSelectedNode() {
        if (this.state.selectedNode) {
            this.state.selectedNode.node.outerCircle.material.color.setHex(
                this.state.nodeColors.outer.normal
            );
            this.state.selectedNode.node.innerCircle.material.color.setHex(
                this.state.nodeColors.inner.normal
            );
            this.state.selectedNode = null;
        }
        // set cursor to default
        this.renderer.domElement.style.cursor = 'crosshair';
    }

    // Add a new wall node at the clicked position
    mouseEventHandle(clientX, clientY) {
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        // Check if clicked on existing node
        const clickedNode = this.findClickedNode(worldPoint);
        if (clickedNode) {
            this.selectNode(clickedNode);
            return;
        }

        // Create new node
        const node = this.createNode(worldPoint);
        this.state.nodes.push(node);
        this.state.points.push(worldPoint);

        // Create wall segment if we have 2+ points
        if (this.state.points.length >= 2) {
            this.createWallSegment();
        }
    }

    // Create a new node with inner/outer circles
    createNode(position) {
        const outerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(this.state.nodeRadius, 32),
            new THREE.MeshBasicMaterial({
                color: this.state.nodeColors.outer.normal,
                side: THREE.DoubleSide
            })
        );
        outerCircle.position.set(position.x, position.y, 0.1);

        const innerCircle = new THREE.Mesh(
            new THREE.CircleGeometry(this.state.nodeRadius - 0.02, 32),
            new THREE.MeshBasicMaterial({
                color: this.state.nodeColors.inner.normal,
                side: THREE.DoubleSide
            })
        );
        innerCircle.position.set(position.x, position.y, 0.11);

        this.scene.add(outerCircle);
        this.scene.add(innerCircle);

        return { outerCircle, innerCircle };
    }

    // Create wall segment between last two points
    createWallSegment() {
        const points = this.state.points;
        const lastIndex = points.length - 1;
        const startPoint = points[lastIndex - 1];
        const endPoint = points[lastIndex];

        // Calculate direction and perpendicular vectors
        const direction = new THREE.Vector2(
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y
        ).normalize();

        const perpendicular = new THREE.Vector2(-direction.y, direction.x);
        const halfWidth = this.state.wallWidth * 0.005;

        // Create rectangle vertices
        const vertices = [
            new THREE.Vector3(
                startPoint.x + perpendicular.x * halfWidth,
                startPoint.y + perpendicular.y * halfWidth,
                0.1
            ),
            new THREE.Vector3(
                endPoint.x + perpendicular.x * halfWidth,
                endPoint.y + perpendicular.y * halfWidth,
                0.1
            ),
            new THREE.Vector3(
                endPoint.x - perpendicular.x * halfWidth,
                endPoint.y - perpendicular.y * halfWidth,
                0.1
            ),
            new THREE.Vector3(
                startPoint.x - perpendicular.x * halfWidth,
                startPoint.y - perpendicular.y * halfWidth,
                0.1
            )
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(vertices);
        geometry.setIndex([0, 1, 2, 0, 2, 3]);

        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });

        const wall = new THREE.Mesh(geometry, material);
        this.scene.add(wall);
        this.state.segments.push(wall);
    }

    // Find if clicked position hits any node
    findClickedNode(worldPoint) {
        for (let i = 0; i < this.state.nodes.length; i++) {
            const node = this.state.nodes[i];
            const nodePos = node.outerCircle.position;

            const distance = Math.sqrt(
                Math.pow(worldPoint.x - nodePos.x, 2) +
                Math.pow(worldPoint.y - nodePos.y, 2)
            );

            if (distance <= this.state.nodeRadius) {
                return {
                    index: i,
                    node: node
                };
            }
        }
        return null;
    }

    // Select a node for moving
    selectNode(nodeInfo) {
        this.state.selectedNode = nodeInfo;

        nodeInfo.node.outerCircle.material.color.setHex(
            this.state.nodeColors.outer.selected
        );
        nodeInfo.node.innerCircle.material.color.setHex(
            this.state.nodeColors.inner.selected
        );

        // set cursor to move
        this.renderer.domElement.style.cursor = 'move';
    }

    // reset cursor
    resetCursor() {
        if (this.state.selectedNode) {
            // reset node
            this.state.selectedNode.node.outerCircle.material.color.setHex(
                this.state.nodeColors.outer.normal
            );
            this.state.selectedNode.node.innerCircle.material.color.setHex(
                this.state.nodeColors.inner.normal
            );
            this.state.selectedNode = null;
            // reset cursor
            this.renderer.domElement.style.cursor = 'crosshair';
        }
    }

    // Update selected node position
    updateNodePosition(clientX, clientY) {
        if (!this.state.selectedNode) {
            return;
        }
        const worldPoint = this.getWorldPosition(clientX, clientY);
        if (!worldPoint) return;

        //set cursor to move
        this.renderer.domElement.style.cursor = 'move';

        const { node, index } = this.state.selectedNode;

        // Cập nhật vị trí node
        node.outerCircle.position.set(worldPoint.x, worldPoint.y, 0.1);
        node.innerCircle.position.set(worldPoint.x, worldPoint.y, 0.11);
        this.state.points[index] = worldPoint;

        // Cập nhật các đoạn thẳng kết nối
        this.updateConnectedSegments(index, worldPoint);
    }

    updateConnectedSegments(nodeIndex, newPosition) {
        const points = this.state.points;
        const segments = this.state.segments;
        const halfWidth = this.state.wallWidth * 0.005;

        // Cập nhật đoạn thẳng phía trước node
        if (nodeIndex < points.length - 1) {
            const startPoint = newPosition;
            const endPoint = points[nodeIndex + 1];
            const direction = new THREE.Vector2(
                endPoint.x - startPoint.x,
                endPoint.y - startPoint.y
            ).normalize();
            const perpendicular = new THREE.Vector2(-direction.y, direction.x);

            const vertices = [
                new THREE.Vector3(
                    startPoint.x + perpendicular.x * halfWidth,
                    startPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x + perpendicular.x * halfWidth,
                    endPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x - perpendicular.x * halfWidth,
                    endPoint.y - perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    startPoint.x - perpendicular.x * halfWidth,
                    startPoint.y - perpendicular.y * halfWidth,
                    0.1
                )
            ];

            const segment = segments[nodeIndex];
            segment.geometry.dispose();
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setFromPoints(vertices);
            newGeometry.setIndex([0, 1, 2, 0, 2, 3]);
            segment.geometry = newGeometry;
        }

        // Cập nhật đoạn thẳng phía sau node
        if (nodeIndex > 0) {
            const startPoint = points[nodeIndex - 1];
            const endPoint = newPosition;
            const direction = new THREE.Vector2(
                endPoint.x - startPoint.x,
                endPoint.y - startPoint.y
            ).normalize();
            const perpendicular = new THREE.Vector2(-direction.y, direction.x);

            const vertices = [
                new THREE.Vector3(
                    startPoint.x + perpendicular.x * halfWidth,
                    startPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x + perpendicular.x * halfWidth,
                    endPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x - perpendicular.x * halfWidth,
                    endPoint.y - perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    startPoint.x - perpendicular.x * halfWidth,
                    startPoint.y - perpendicular.y * halfWidth,
                    0.1
                )
            ];

            const segment = segments[nodeIndex - 1];
            segment.geometry.dispose();
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setFromPoints(vertices);
            newGeometry.setIndex([0, 1, 2, 0, 2, 3]);
            segment.geometry = newGeometry;
        }
    }
    // update line width
    updateLineWidth(width) {

        // Cập nhật độ rộng cho tất cả các đoạn thẳng
        const points = this.state.points;
        this.state.segments.forEach((segment, index) => {
            const startPoint = points[index];
            const endPoint = points[index + 1];
            const direction = new THREE.Vector2(
                endPoint.x - startPoint.x,
                endPoint.y - startPoint.y
            ).normalize();
            const perpendicular = new THREE.Vector2(-direction.y, direction.x);
            const halfWidth = width * 0.005;

            const vertices = [
                new THREE.Vector3(
                    startPoint.x + perpendicular.x * halfWidth,
                    startPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x + perpendicular.x * halfWidth,
                    endPoint.y + perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    endPoint.x - perpendicular.x * halfWidth,
                    endPoint.y - perpendicular.y * halfWidth,
                    0.1
                ),
                new THREE.Vector3(
                    startPoint.x - perpendicular.x * halfWidth,
                    startPoint.y - perpendicular.y * halfWidth,
                    0.1
                )
            ];

            segment.geometry.dispose();
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setFromPoints(vertices);
            newGeometry.setIndex([0, 1, 2, 0, 2, 3]);
            segment.geometry = newGeometry;
        }); 
    }

    // Convert client coordinates to world position
    getWorldPosition(clientX, clientY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1));
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        return intersection;
    }
    // apply wall to map
    applyWallToMap() {
        
         // Lấy texture của map
         const texture = this.mapMesh.material.map;
         const data = texture.image.data;

         // Duyệt qua tất cả các đoạn thẳng
         this.state.segments.forEach((segment, index) => {
             const points = this.state.points;
             const startPoint = points[index];
             const endPoint = points[index + 1];

             // Chuyển từ tọa độ world sang pixel
             const startPixelX = Math.floor((startPoint.x - this.mapInfo.origin.position.x) / this.mapInfo.resolution);
             const startPixelY = Math.floor((startPoint.y - this.mapInfo.origin.position.y) / this.mapInfo.resolution);
             const endPixelX = Math.floor((endPoint.x - this.mapInfo.origin.position.x) / this.mapInfo.resolution);
             const endPixelY = Math.floor((endPoint.y - this.mapInfo.origin.position.y) / this.mapInfo.resolution);

             // Tính toán vector hướng và độ dài
             const dx = endPixelX - startPixelX;
             const dy = endPixelY - startPixelY;
             const distance = Math.sqrt(dx * dx + dy * dy);

             // Vẽ đường thẳng bằng thuật toán Bresenham
             const lineWidth = Math.ceil((this.state.wallWidth * 0.005) / this.mapInfo.resolution);
             const halfWidth = Math.floor(lineWidth / 2);

             for (let t = 0; t <= distance; t++) {
                 const x = Math.round(startPixelX + (dx * t / distance));
                 const y = Math.round(startPixelY + (dy * t / distance));

                 // Vẽ pixel với độ dày halfWidth
                 for (let w = -halfWidth; w <= halfWidth; w++) {
                     for (let h = -halfWidth; h <= halfWidth; h++) {
                         const currentX = x + w;
                         const currentY = y + h;

                         // Kiểm tra pixel có nằm trong map không
                         if (currentX >= 0 && currentX < this.mapInfo.width &&
                             currentY >= 0 && currentY < this.mapInfo.height) {

                             const index = (currentY * this.mapInfo.width + currentX) * 4;
                             // Set màu đen (0, 0, 0)
                             data[index] = 0;     // R
                             data[index + 1] = 0; // G
                             data[index + 2] = 0; // B
                             data[index + 3] = 255; // A
                         }
                     }
                 }
             }
         });
         this.clear();
         // Cập nhật texture
         texture.needsUpdate = true;
    }

    // Clear all walls and nodes
    clear() {
        // Remove nodes
        this.state.nodes.forEach(node => {
            this.scene.remove(node.outerCircle);
            this.scene.remove(node.innerCircle);
            node.outerCircle.geometry.dispose();
            node.outerCircle.material.dispose();
            node.innerCircle.geometry.dispose();
            node.innerCircle.material.dispose();
        });

        // Remove wall segments
        this.state.segments.forEach(wall => {
            this.scene.remove(wall);
            wall.geometry.dispose();
            wall.material.dispose();
        });

        // Reset state
        this.state.nodes = [];
        this.state.points = [];
        this.state.segments = [];
        this.state.selectedNode = null;
        this.mapBackup = null;
    }
    dispose() {
        this.clear();
    }
}

export { DrawWall };
