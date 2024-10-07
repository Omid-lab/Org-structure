import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DraggableBox = ({ id, children, type, onMove, onDelete, onConnect, onRename }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'box',
    item: { id, type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(children);

  const handleRename = () => {
    if (newName.trim() !== '') {
      onRename(id, newName);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '1px solid #ccc',
        padding: '0.5rem',
        margin: '0.5rem',
        backgroundColor: type === 'department' ? '#e6f7ff' : type === 'division' ? '#d4edda' : '#fff1b8',
        display: 'inline-block',
        width: '150px',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {isEditing ? (
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          autoFocus
        />
      ) : (
        <div onDoubleClick={() => setIsEditing(true)}>{children}</div>
      )}
      <div>
        <button onClick={() => onMove('left')} style={{marginRight: '5px'}}>←</button>
        <button onClick={() => onMove('right')} style={{marginRight: '5px'}}>→</button>
        <button onClick={onDelete} style={{backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px'}}>X</button>
        <button onClick={onConnect} style={{backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px'}}>Connect</button>
      </div>
    </div>
  );
};

const DropZone = ({ onDrop, children }) => {
  const dropRef = useRef(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'box',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && dropRef.current) {
        onDrop(item, offset, dropRef.current.getBoundingClientRect());
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  drop(dropRef);

  return (
    <div
      ref={dropRef}
      style={{
        minHeight: '600px',
        border: '2px dashed #ccc',
        padding: '1rem',
        backgroundColor: isOver ? '#f0f0f0' : 'white',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

const Line = ({ start, end }) => (
  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <line
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      stroke="black"
      strokeWidth="2"
    />
  </svg>
);

const OrganizationalStructureBuilder = () => {
  const [structure, setStructure] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectingMode, setConnectingMode] = useState(null);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([
    { id: 'product-a', label: 'Product A Division' },
    { id: 'product-b', label: 'Product B Division' },
  ]);

  const components = [
    { id: 'board', type: 'position', label: 'Board' },
    { id: 'ceo', type: 'position', label: 'CEO' },
    { id: 'manager', type: 'position', label: 'Manager' },
    { id: 'employee', type: 'position', label: 'Employee' },
    { id: 'hr', type: 'department', label: 'HR Department' },
    { id: 'finance', type: 'department', label: 'Finance Department' },
    { id: 'marketing', type: 'department', label: 'Marketing Department' },
    { id: 'sales', type: 'department', label: 'Sales Department' },
    { id: 'logistics', type: 'department', label: 'Logistics Department' },
    { id: 'accounting', type: 'department', label: 'Accounting Department' },
    { id: 'it', type: 'department', label: 'IT Department' },
    ...products.map(product => ({ ...product, type: 'division' })),
  ];

  useEffect(() => {
    const handleError = (event) => {
      console.error('Unhandled error:', event.error);
      setError('An unexpected error occurred. Please check the console for details.');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleDrop = (item, offset, dropZoneRect) => {
    try {
      if (!dropZoneRect) {
        throw new Error('Drop zone coordinates not available');
      }
      const x = Math.round((offset.x - dropZoneRect.left) / 160) * 160;
      const y = Math.round((offset.y - dropZoneRect.top) / 80) * 80;
      
      const newId = `${item.id}-${Date.now()}`;
      setStructure(prev => [...prev, { ...item, id: newId, x, y }]);
      setError(null);
    } catch (err) {
      console.error('Error in handleDrop:', err);
      setError('Failed to add item. Please try again.');
    }
  };

  const handleMove = (id, direction) => {
    try {
      setStructure(prev => prev.map(item => 
        item.id === id ? { ...item, x: item.x + (direction === 'left' ? -160 : 160) } : item
      ));
      setError(null);
    } catch (err) {
      console.error('Error in handleMove:', err);
      setError('Failed to move item. Please try again.');
    }
  };

  const handleDelete = (id) => {
    setStructure(prev => prev.filter(item => item.id !== id));
    setConnections(prev => prev.filter(conn => conn.start !== id && conn.end !== id));
  };

  const handleConnect = (id) => {
    if (connectingMode) {
      setConnections(prev => [...prev, { start: connectingMode, end: id }]);
      setConnectingMode(null);
    } else {
      setConnectingMode(id);
    }
  };

  const handleRename = (id, newName) => {
    setStructure(prev => prev.map(item => 
      item.id === id ? { ...item, label: newName } : item
    ));
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, label: newName } : product
    ));
  };

  const addNewProduct = () => {
    const newId = `product-${String.fromCharCode(97 + products.length)}`;
    const newProduct = { id: newId, label: `Product ${String.fromCharCode(65 + products.length)} Division` };
    setProducts(prev => [...prev, newProduct]);
  };

  const resetStructure = () => {
    setStructure([]);
    setConnections([]);
    setConnectingMode(null);
    setError(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '30%', padding: '1rem', overflowY: 'auto', maxHeight: '80vh' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Available Components</h3>
          {components.map((component) => (
            <DraggableBox 
              key={component.id} 
              id={component.id} 
              type={component.type} 
              onMove={() => {}} 
              onDelete={() => {}} 
              onConnect={() => {}}
              onRename={handleRename}
            >
              {component.label}
            </DraggableBox>
          ))}
          <button 
            onClick={addNewProduct}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#52c41a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add New Product/Division
          </button>
        </div>
        <div style={{ width: '70%', padding: '1rem' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Organizational Structure</h3>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <DropZone onDrop={handleDrop}>
            {connections.map((conn, index) => {
              const start = structure.find(item => item.id === conn.start);
              const end = structure.find(item => item.id === conn.end);
              if (start && end) {
                return <Line key={index} start={{ x: start.x + 75, y: start.y + 30 }} end={{ x: end.x + 75, y: end.y + 30 }} />;
              }
              return null;
            })}
            {structure.map((item) => (
              <div key={item.id} style={{ position: 'absolute', left: item.x, top: item.y }}>
                <DraggableBox 
                  id={item.id} 
                  type={item.type} 
                  onMove={(direction) => handleMove(item.id, direction)}
                  onDelete={() => handleDelete(item.id)}
                  onConnect={() => handleConnect(item.id)}
                  onRename={handleRename}
                >
                  {item.label || item.id.split('-')[0]}
                </DraggableBox>
              </div>
            ))}
          </DropZone>
          <button 
            onClick={resetStructure}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset Structure
          </button>
        </div>
      </div>
    </DndProvider>
  );
};

export default OrganizationalStructureBuilder;