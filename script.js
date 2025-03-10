document.addEventListener('DOMContentLoaded', function() {
    const workspace = document.getElementById('workspace');
    const createNodeBtn = document.getElementById('createNode');
    const createPointerBtn = document.getElementById('createPointer');
    const createDoublyNodeBtn = document.getElementById('createDoublyNode');
    const resetBtn = document.getElementById('resetBtn');
    
    let currentId = 1;
    let isDragging = false;
    let isConnecting = false;
    let selectedElement = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let connections = [];
    let tempLine = null;
    let sourcePointer = null;

    // Create SVG namespace for dynamic elements
    const svgNS = "http://www.w3.org/2000/svg";
    
    // Create the SVG defs with arrowhead marker
    createSVGDefs();

    function createSVGDefs() {
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = "absolute";
        
        const defs = document.createElementNS(svgNS, "defs");
        
        const marker = document.createElementNS(svgNS, "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        
        const polygon = document.createElementNS(svgNS, "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
        polygon.setAttribute("fill", "#fbbc05");
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        
        document.body.appendChild(svg);
    }

    // Generate a random memory address
    function generateAddress() {
        return '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0').toUpperCase();
    }

    // Create a new node
    createNodeBtn.addEventListener('click', function() {
        const id = currentId++;
        const address = generateAddress();
        const node = document.createElement('div');
        node.className = 'memory-box node';
        node.id = `node-${id}`;
        node.dataset.address = address;
        node.dataset.type = 'node';
        node.innerHTML = `
            <div class="delete-btn" title="Delete node">✕</div>
            <div class="title" contenteditable="true">Node ${id}</div>
            <div class="data-section">${Math.floor(Math.random() * 100)}</div>
            <div class="pointer-section">
                <span>next:</span>
                <div class="pointer-value">NULL</div>
                <div class="pointer-handle" data-ptr-id="node-${id}"></div>
            </div>
            <div class="address">${address}</div>
        `;
        
        const randomLeft = Math.floor(Math.random() * (workspace.offsetWidth - 200)) + 20;
        const randomTop = Math.floor(Math.random() * (workspace.offsetHeight - 180)) + 20;
        
        node.style.left = `${randomLeft}px`;
        node.style.top = `${randomTop}px`;
        
        workspace.appendChild(node);
        makeElementDraggable(node);
        makePointerConnectable(node.querySelector('.pointer-handle'));
        setupDeleteButton(node.querySelector('.delete-btn'), node);
        showNotification("Node added");
    });

    // Create a new standalone pointer
    createPointerBtn.addEventListener('click', function() {
        const id = currentId++;
        const address = generateAddress();
        const pointer = document.createElement('div');
        pointer.className = 'memory-box pointer';
        pointer.id = `ptr-${id}`;
        pointer.dataset.address = address;
        pointer.dataset.type = 'pointer';
        pointer.innerHTML = `
            <div class="title" contenteditable="true">Node* ptr${id}</div>
            <div class="value">NULL</div>
            <div class="address">${address}</div>
            <div class="pointer-handle" data-ptr-id="${id}"></div>
        `;
        
        const randomLeft = Math.floor(Math.random() * (workspace.offsetWidth - 150)) + 20;
        const randomTop = Math.floor(Math.random() * (workspace.offsetHeight - 150)) + 20;
        
        pointer.style.left = `${randomLeft}px`;
        pointer.style.top = `${randomTop}px`;
        
        workspace.appendChild(pointer);
        makeElementDraggable(pointer);
        makePointerConnectable(pointer.querySelector('.pointer-handle'));

        showNotification("Pointer added");
    });

    // Create a new doubly node
    createDoublyNodeBtn.addEventListener('click', function() {
        const id = currentId++;
        const address = generateAddress();
        const node = document.createElement('div');
        node.className = 'memory-box doubly-node';
        node.id = `node-${id}`;
        node.dataset.address = address;
        node.dataset.type = 'doubly-node';
        node.innerHTML = `
            <div class="delete-btn" title="Delete node">✕</div>
            <div class="title" contenteditable="true">DoublyNode ${id}</div>
            <div class="prev-pointer-section">
                <span>prev:</span>
                <div class="pointer-value">NULL</div>
                <div class="prev-pointer-handle" data-ptr-id="prev-node-${id}"></div>
            </div>
            <div class="data-section">${Math.floor(Math.random() * 100)}</div>
            <div class="pointer-section">
                <span>next:</span>
                <div class="pointer-value">NULL</div>
                <div class="pointer-handle" data-ptr-id="next-node-${id}"></div>
            </div>
            <div class="address">${address}</div>
        `;
        
        const randomLeft = Math.floor(Math.random() * (workspace.offsetWidth - 250)) + 30;
        const randomTop = Math.floor(Math.random() * (workspace.offsetHeight - 200)) + 30;
        
        node.style.left = `${randomLeft}px`;
        node.style.top = `${randomTop}px`;
        
        workspace.appendChild(node);
        makeElementDraggable(node);
        makePointerConnectable(node.querySelector('.pointer-handle'));
        makePointerConnectable(node.querySelector('.prev-pointer-handle'));
        setupDeleteButton(node.querySelector('.delete-btn'), node);

        showNotification("Node added");
    });

    // Reset the workspace
    resetBtn.addEventListener('click', function() {
        workspace.innerHTML = '';
        connections = [];
        currentId = 1;

        showNotification("Reset successful");
    });

    // Make an element draggable
    function makeElementDraggable(element) {
        element.addEventListener('mousedown', function(e) {
            // Don't start drag if clicking on the pointer handle
            if (e.target.classList.contains('pointer-handle') || e.target.classList.contains('prev-pointer-handle')) return;
            
            isDragging = true;
            selectedElement = element;
            dragOffsetX = e.clientX - element.getBoundingClientRect().left;
            dragOffsetY = e.clientY - element.getBoundingClientRect().top;
            
            element.style.zIndex = 1000;
        });
    }

    // Make a pointer handle connectable
    function makePointerConnectable(handle) {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            isConnecting = true;
            
            const pointerId = handle.dataset.ptrId;
            if (pointerId.startsWith('node-')) {
                sourcePointer = document.getElementById(pointerId);
            } else if (pointerId.startsWith('prev-node-')) {
                // For prev pointer in doubly linked list node
                const nodeId = pointerId.replace('prev-', '');
                sourcePointer = document.getElementById(nodeId);
                sourcePointer.dataset.activePointer = 'prev';
            } else if (pointerId.startsWith('next-node-')) {
                // For next pointer in doubly linked list node
                const nodeId = pointerId.replace('next-', '');
                sourcePointer = document.getElementById(nodeId);
                sourcePointer.dataset.activePointer = 'next';
            } else {
                sourcePointer = document.getElementById(`ptr-${pointerId}`);
            }
            
            // Create a temporary line for dragging
            tempLine = document.createElementNS(svgNS, "svg");
            tempLine.setAttribute("class", "temp-line");
            tempLine.setAttribute("width", "100%");
            tempLine.setAttribute("height", "100%");
            tempLine.style.position = "absolute";
            tempLine.style.top = "0";
            tempLine.style.left = "0";
            tempLine.style.pointerEvents = "none";
            
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("stroke", "#fbbc05");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("stroke-dasharray", "5,5");
            path.setAttribute("fill", "none");
            
            tempLine.appendChild(path);
            workspace.appendChild(tempLine);
            
            // Starting position is the center of the handle
            const handleRect = handle.getBoundingClientRect();
            const workspaceRect = workspace.getBoundingClientRect();
            const startX = handleRect.left - workspaceRect.left + handle.offsetWidth/2;
            const startY = handleRect.top - workspaceRect.top + handle.offsetHeight/2;
            
            updateTempLine(startX, startY, e.clientX - workspaceRect.left, e.clientY - workspaceRect.top);
        });
    }

    // Update the temporary line during dragging
    function updateTempLine(startX, startY, endX, endY) {
        if (!tempLine) return;
        
        const path = tempLine.querySelector('path');
        path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
    }

    // Handle mouse move for dragging and connecting
    document.addEventListener('mousemove', function(e) {
        if (isDragging && selectedElement) {
            const containerRect = workspace.getBoundingClientRect();
            const left = e.clientX - containerRect.left - dragOffsetX;
            const top = e.clientY - containerRect.top - dragOffsetY;
            
            // Keep element within container bounds
            const maxLeft = containerRect.width - selectedElement.offsetWidth;
            const maxTop = containerRect.height - selectedElement.offsetHeight;
            
            selectedElement.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`;
            selectedElement.style.top = `${Math.max(0, Math.min(top, maxTop))}px`;
            
            // Update connections
            updateConnections();
        }
        
        if (isConnecting && tempLine && sourcePointer) {
            const handleElement = sourcePointer.querySelector('.pointer-handle');
            const handleRect = handleElement.getBoundingClientRect();
            const workspaceRect = workspace.getBoundingClientRect();
            const startX = handleRect.left - workspaceRect.left + handleElement.offsetWidth/2;
            const startY = handleRect.top - workspaceRect.top + handleElement.offsetHeight/2;
            const endX = e.clientX - workspaceRect.left;
            const endY = e.clientY - workspaceRect.top;
            
            updateTempLine(startX, startY, endX, endY);
        }
    });

    // Handle mouse up to end dragging or connecting
    document.addEventListener('mouseup', function(e) {
        if (isDragging) {
            isDragging = false;
            if (selectedElement) {
                selectedElement.style.zIndex = '';
                selectedElement = null;
            }
        }
        
        if (isConnecting) {
            isConnecting = false;
            
            if (tempLine) {
                workspace.removeChild(tempLine);
                tempLine = null;
            }
            
            // Check if mouse is over a node
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const targetNode = elements.find(el => 
                (el.classList.contains('memory-box') && (el.dataset.type === 'node' || el.dataset.type === 'pointer' || el.dataset.type === 'doubly-node')) &&
                el !== sourcePointer
            );
            
            if (targetNode && sourcePointer) {
                connectPointerToNode(sourcePointer, targetNode, e);
            }
            
            sourcePointer = null;
        }
    });

    // Connect a pointer to a node
    function connectPointerToNode(source, target, e) {
    const sourceId = source.id;
    const isSourcePrev = source.dataset.activePointer === 'prev';
    
    // Remove any existing connection for this pointer
    connections = connections.filter(conn => {
        if (conn.sourceId === sourceId && 
            ((!isSourcePrev && !conn.isSourcePrev) || 
             (isSourcePrev && conn.isSourcePrev))) {
            const existingLine = document.getElementById(
                `connection-${conn.sourceId}${isSourcePrev ? '-prev' : ''}`
            );
            if (existingLine) {
                workspace.removeChild(existingLine);
            }
            return false;
        }
        return true;
    });

    // Determine if the drop is in the node’s pointer section
    let actualTarget = target;
    let isTargetingPointerSection = false;
    let isPointingToNull = false;

    if (target.dataset.type === 'doubly-node') {
        let prevPointerSection = null;
        const pps = target.querySelector('.prev-pointer-section');
        if (pps) {
            const ppsRect = pps.getBoundingClientRect();
            if (e.clientX >= ppsRect.left && e.clientX <= ppsRect.right &&
                e.clientY >= ppsRect.top && e.clientY <= ppsRect.bottom) {
                prevPointerSection = pps;
            }
        }
        if (prevPointerSection) {
            isTargetingPointerSection = true;
            const nodeConnection = connections.find(conn => conn.sourceId === target.id && conn.isSourcePrev);
            if (nodeConnection) {
                actualTarget = document.getElementById(nodeConnection.targetId);
            } else {
                isPointingToNull = true;
                actualTarget = null;
            }
        } else {
            let pointerSection = null;
            const ps = target.querySelector('.pointer-section');
            if (ps) {
                const psRect = ps.getBoundingClientRect();
                if (e.clientX >= psRect.left && e.clientX <= psRect.right &&
                    e.clientY >= psRect.top && e.clientY <= psRect.bottom) {
                    pointerSection = ps;
                }
            }
            if (pointerSection) {
                isTargetingPointerSection = true;
                const nodeConnection = connections.find(conn => conn.sourceId === target.id && !conn.isSourcePrev);
                if (nodeConnection) {
                    actualTarget = document.getElementById(nodeConnection.targetId);
                } else {
                    isPointingToNull = true;
                    actualTarget = null;
                }
            }
        }
    }

    // Clear any “deleted” styling
    if (source.dataset.type === 'pointer') {
        source.querySelector('.value').classList.remove('deleted-pointer');
    } else if (source.dataset.type === 'node') {
        source.querySelector('.pointer-value').classList.remove('deleted-pointer');
    } else if (source.dataset.type === 'doubly-node') {
        if (isSourcePrev) {
            const pointerValues = source.querySelectorAll('.prev-pointer-section .pointer-value');
            pointerValues.forEach(pv => pv.classList.remove('deleted-pointer'));
        } else {
            const pointerValues = source.querySelectorAll('.pointer-section .pointer-value');
            pointerValues.forEach(pv => pv.classList.remove('deleted-pointer'));
        }
    }

    // Only create a connection if the target isn’t NULL
    if (!isPointingToNull && actualTarget) {
        connections.push({
            sourceId: sourceId,
            targetId: actualTarget.id,
            isTargetingPointerSection: isTargetingPointerSection,
            isSourcePrev: isSourcePrev
        });
    }

    // Update the pointer’s displayed value
    if (source.dataset.type === 'pointer') {
        source.querySelector('.value').textContent = actualTarget ? actualTarget.dataset.address : 'NULL';
    } else if (source.dataset.type === 'node') {
        source.querySelector('.pointer-value').textContent = actualTarget ? actualTarget.dataset.address : 'NULL';
    } else if (source.dataset.type === 'doubly-node') {
        if (isSourcePrev) {
            source.querySelector('.prev-pointer-section .pointer-value').textContent = 
                actualTarget ? actualTarget.dataset.address : 'NULL';
        } else {
            source.querySelector('.pointer-section .pointer-value').textContent = 
                actualTarget ? actualTarget.dataset.address : 'NULL';
        }
    }

    // Reset the active pointer flag
    delete source.dataset.activePointer;

    // Draw connection only if there’s a valid target
    if (actualTarget) {
        drawConnection(source, actualTarget, isSourcePrev);
    }
}
    // Draw a connection line between a pointer and a node
    function drawConnection(source, target, isSourcePrev = false) {
        const svg = document.createElementNS(svgNS, "svg");
        const connectionId = `connection-${source.id}${isSourcePrev ? '-prev' : ''}`;
        svg.setAttribute("id", connectionId);
        svg.setAttribute("class", "connection-line");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("class", "connection-arrow");
        path.setAttribute("marker-end", "url(#arrowhead)");
        
        svg.appendChild(path);
        workspace.appendChild(svg);
        
        updateConnectionPath(source, target, svg, isSourcePrev);
    }

    
function isPointInsideRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// Helper: Sample points along a quadratic Bézier curve between (startX, startY) and (endX, endY)
// using the control point (controlX, controlY). Returns an array of {x, y} objects.
function sampleQuadraticBezier(startX, startY, controlX, controlY, endX, endY, steps = 20) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * endX;
        const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * endY;
        points.push({ x, y });
    }
    return points;
}

// Checks if a point (x, y) is inside a rectangle (with properties: left, top, right, bottom)
function isPointInsideRect(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// Samples points along a quadratic Bézier curve between (startX, startY) and (endX, endY)
// using the control point (controlX, controlY). Returns an array of {x, y} objects.
function sampleQuadraticBezier(startX, startY, controlX, controlY, endX, endY, steps = 20) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * controlX + t * t * endX;
        const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * controlY + t * t * endY;
        points.push({ x, y });
    }
    return points;
}

// Compute a safe control point for the Bézier curve so that no sample point falls
// inside any interfering rectangle and the candidate stays within the workspace.
// If the arrow is heading out of the workspace from the top, the candidate will be forced below;
// if it’s leaving from below, the candidate will be forced above.
function computeSafeControlPoint(startX, startY, endX, endY, interferingRects) {
    // Compute the midpoint and unit perpendicular vector from start to end.
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    let unitPerpX = 0, unitPerpY = 0;
    if (len !== 0) {
        unitPerpX = -dy / len;
        unitPerpY = dx / len;
    }
    
    // Workspace dimensions (relative coordinates: 0 to workspace.offsetWidth/offsetHeight)
    const wsWidth = workspace.offsetWidth;
    const wsHeight = workspace.offsetHeight;
    
    // candidateIsValid tests two things:
    // 1. The candidate control point lies inside the workspace.
    // 2. All sampled points along the curve avoid interfering rectangles.
    function candidateIsValid(controlX, controlY) {
        if (controlX < 0 || controlX > wsWidth || controlY < 0 || controlY > wsHeight) {
            return false;
        }
        const samples = sampleQuadraticBezier(startX, startY, controlX, controlY, endX, endY, 20);
        for (const pt of samples) {
            for (const rect of interferingRects) {
                if (isPointInsideRect(pt.x, pt.y, rect)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Start with an initial offset.
    let offset = 40;
    const maxOffset = 300;
    let candidateFound = null;
    
    // We try both perpendicular directions.
    while (offset <= maxOffset && !candidateFound) {
        // Candidate in the positive perpendicular direction.
        let candidatePos = {
            x: midX + unitPerpX * offset,
            y: midY + unitPerpY * offset
        };
        // Candidate in the negative perpendicular direction.
        let candidateNeg = {
            x: midX - unitPerpX * offset,
            y: midY - unitPerpY * offset
        };
        
        // If the arrow is heading out of the workspace from the top (start or end near top)
        // then force candidate control point below the midpoint.
        if (startY < 40 || endY < 40) {
            candidatePos = { x: midX - unitPerpX * offset, y: midY - unitPerpY * offset };
            candidateNeg = { x: midX + unitPerpX * offset, y: midY + unitPerpY * offset };
        }
        // If the arrow is near the bottom edge, force the control point upward.
        if (startY > wsHeight - 40 || endY > wsHeight - 40) {
            candidatePos = { x: midX + unitPerpX * offset, y: midY + unitPerpY * offset };
            candidateNeg = { x: midX - unitPerpX * offset, y: midY - unitPerpY * offset };
        }
        
        const validPos = candidateIsValid(candidatePos.x, candidatePos.y);
        const validNeg = candidateIsValid(candidateNeg.x, candidateNeg.y);
        
        if (validPos && validNeg) {
            // Choose the candidate with the smaller offset (or arbitrarily if equal).
            candidateFound = candidatePos; // (offset is the same for both)
        } else if (validPos) {
            candidateFound = candidatePos;
        } else if (validNeg) {
            candidateFound = candidateNeg;
        }
        
        offset += 20;
    }
    
    // If no valid candidate was found, return the straight-line midpoint (allow crossing).
    return candidateFound || { x: midX, y: midY };
}

// --- Updated updateConnectionPath Function ---

function updateConnectionPath(source, target, svg, isSourcePrev = false) {
    // Select the correct pointer handle.
    const sourceHandle = isSourcePrev ?
        source.querySelector('.prev-pointer-handle') :
        source.querySelector('.pointer-handle');
    if (!sourceHandle) return;
    
    // Get bounding rectangles relative to the workspace.
    const workspaceRect = workspace.getBoundingClientRect();
    const sourceRect = sourceHandle.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    // Calculate start point (center of source handle) and end point (using target's top-left).
    const startX = sourceRect.left - workspaceRect.left + sourceHandle.offsetWidth / 2;
    const startY = sourceRect.top - workspaceRect.top + sourceHandle.offsetHeight / 2;
    const endX = targetRect.left - workspaceRect.left;
    const endY = targetRect.top - workspaceRect.top;
    
    // Gather interfering elements (all .memory-box elements except source and target) in workspace-relative coordinates.
    const interferingElements = Array.from(workspace.querySelectorAll('.memory-box')).filter(elem => elem !== source && elem !== target);
    const interferingRects = interferingElements.map(elem => {
        const r = elem.getBoundingClientRect();
        return {
            left: r.left - workspaceRect.left,
            top: r.top - workspaceRect.top,
            right: r.right - workspaceRect.left,
            bottom: r.bottom - workspaceRect.top
        };
    });
    
    // First, sample a straight line to check if it’s collision-free.
    const straightSamples = sampleQuadraticBezier(startX, startY, (startX + endX) / 2, (startY + endY) / 2, endX, endY, 10);
    let straightLineValid = true;
    for (const pt of straightSamples) {
        for (const rect of interferingRects) {
            if (isPointInsideRect(pt.x, pt.y, rect)) {
                straightLineValid = false;
                break;
            }
        }
        if (!straightLineValid) break;
    }
    
    const path = svg.querySelector('path');
    if (straightLineValid) {
        // If no interference, draw a straight line.
        path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
        return;
    }
    
    // Otherwise, compute a safe control point that avoids interfering elements and respects workspace boundaries.
    const controlPoint = computeSafeControlPoint(startX, startY, endX, endY, interferingRects);
    path.setAttribute("d", `M ${startX} ${startY} Q ${controlPoint.x} ${controlPoint.y} ${endX} ${endY}`);
}
    // Function to get the target element at the end of a pointer chain
    function getTargetElementFromPointerChain(sourceId) {
        const connection = connections.find(conn => conn.sourceId === sourceId);
        if (!connection) return null;
        
        const targetId = connection.targetId;
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return null;
        
        // If this connection is pointing to a node's pointer section
        if (connection.isTargetingPointerSection && targetElement.dataset.type === 'node') {
            const nodeConnection = connections.find(conn => conn.sourceId === targetId);
            if (nodeConnection) {
                return document.getElementById(nodeConnection.targetId);
            }
            return null;
        }
        
        // If target is a pointer, recursively follow the chain
        if (targetElement.dataset.type === 'pointer') {
            return getTargetElementFromPointerChain(targetId) || targetElement;
        }
        
        return targetElement;
    }
    
    // Update all connections when elements move
    // Helper function: returns the node (or doubly-node) whose memory address matches the provided address.
function getNodeByAddress(address) {
    const nodes = workspace.querySelectorAll('.memory-box');
    for (const node of nodes) {
        if ((node.dataset.type === 'node' || node.dataset.type === 'doubly-node') && node.dataset.address === address) {
            return node;
        }
    }
    return null;
}

// Updated updateConnections function that updates arrows based on the pointer's held address.
function updateConnections() {
    connections.forEach(conn => {
        const source = document.getElementById(conn.sourceId);
        if (!source) return;
        
        let target;
        const svg = document.getElementById(`connection-${conn.sourceId}${conn.isSourcePrev ? '-prev' : ''}`);
        if (!svg) return;
        
        // Get the pointer address from the source element.
        // For a pointer element, read the text in the '.value' field.
        // For a node element, read the text in the '.pointer-value' field.
        let pointerAddress = '';
        if (source.dataset.type === 'pointer') {
            pointerAddress = source.querySelector('.value').textContent;
        } else if (source.dataset.type === 'node') {
            pointerAddress = source.querySelector('.pointer-value').textContent;
        } else if (source.dataset.type === 'doubly-node') {
            if (conn.isSourcePrev) {
                pointerAddress = source.querySelector('.prev-pointer-section .pointer-value').textContent;
            } else {
                pointerAddress = source.querySelector('.pointer-section .pointer-value').textContent;
            }
        }
        
        // If the pointer holds an address (not "NULL"), look up the corresponding node.
        if (pointerAddress && pointerAddress !== 'NULL') {
            target = getNodeByAddress(pointerAddress);
        }
        
        if (!target) return;
        
        // Update the connection arrow endpoint to the node found by address.
        updateConnectionPath(source, target, svg, conn.isSourcePrev);
    });
}


    // Setup delete button functionality
    function setupDeleteButton(deleteBtn, element) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteElement(element);
        });
    }



    // Delete an element and update connections
    function deleteElement(element) {
        const elementId = element.id;
        
        // Find and mark connections pointing to this element
        connections.forEach(conn => {
            if (conn.targetId === elementId) {
                const sourceElement = document.getElementById(conn.sourceId);
                if (sourceElement) {
                    // Mark the pointer as deleted, but keep the address
                    if (sourceElement.dataset.type === 'pointer') {
                        const valueElement = sourceElement.querySelector('.value');
                        if (valueElement) {
                            valueElement.classList.add('deleted-pointer');
                        }
                    } else if (sourceElement.dataset.type === 'node') {
                        const pointerValue = sourceElement.querySelector('.pointer-value');
                        if (pointerValue) {
                            pointerValue.classList.add('deleted-pointer');
                        }
                    } else if (sourceElement.dataset.type === 'doubly-node') {
                        if (conn.isSourcePrev) {
                            const prevPointerValue = sourceElement.querySelector('.prev-pointer-section .pointer-value');
                            prevPointerValue.classList.add('deleted-pointer');
                        } else {
                            const nextPointerValue = sourceElement.querySelector('.pointer-section .pointer-value');
                            nextPointerValue.classList.add('deleted-pointer');
                        }
                    }
                    
                    // Remove the arrow connection
                    const connectionLine = document.getElementById(`connection-${conn.sourceId}${conn.isSourcePrev ? '-prev' : ''}`);
                    if (connectionLine) {
                        workspace.removeChild(connectionLine);
                    }
                }
            }
        });
        
        // Remove any connection lines from this element
        const connectionLine = document.getElementById(`connection-${elementId}`);
        const connectionLinePrev = document.getElementById(`connection-${elementId}-prev`);
        if (connectionLine) {
            workspace.removeChild(connectionLine);
        }
        if (connectionLinePrev) {
            workspace.removeChild(connectionLinePrev);
        }
        
        // Remove the element from the DOM
        workspace.removeChild(element);
    }

    // Notification function that creates a message element which auto-hides after 1 second.
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    
    // Basic inline styles for the notification. Adjust as needed.
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "4px";
    notification.style.zIndex = "9999";
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 1000);
}

});
