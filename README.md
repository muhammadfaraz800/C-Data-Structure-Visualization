# C++ Data Structure Visualization

This project is a web-based tool that visualizes C++ data structures such as nodes, pointers, linked lists, and doubly linked lists. It uses HTML, CSS, and JavaScript to create interactive, draggable elements so you can see pointer operations and memory addresses in action.

## Features

- **Interactive Nodes and Pointers:** Create nodes, pointers, and doubly linked nodes.
- **Dynamic Connections:** Connect pointers to nodes via drag-and-drop, with arrow visualizations that update based on memory addresses.
- **Real-Time Updates:** When a node is moved, all connected pointers update automatically to point to the correct node.
- **Notifications:** On adding nodes, pointers, or resetting the workspace, a temporary notification is displayed.
- **PWA Ready:** A `manifest.json` file is included for Progressive Web App support.

## How to Use

1. Open `index.html` in your browser.
2. Use the control panel buttons to:
   - **Create Node:** Adds a new node with a randomly generated memory address.
   - **Create Pointer:** Adds a pointer that can be connected to a node.
   - **Create Doubly Node:** Adds a node with both previous and next pointers.
   - **Reset:** Clears the workspace.
3. Drag nodes around to see pointer connections update in real time.
4. Click and drag from a pointer handle to connect it to a node.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/yourusername/cpp-dsa-visualization.git
