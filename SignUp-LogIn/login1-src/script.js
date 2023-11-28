const eventSource = new EventSource('http://localhost:3001');

    eventSource.onmessage = (event) => {
      console.log('Received update:', event.data);
      location.reload(true); // Trigger a page refresh
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
    };
