document.addEventListener('DOMContentLoaded', async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  console.log(id);
  if (!id) {
    return;
  } else {
    const endpoint = '/api/protected/';
    try {
      console.log(Date.now());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const jsonData = await response.json();
      const localStore = jsonData.GrupoDeMaestro;
      const data = `{"${endpoint}":${JSON.stringify(localStore)}}`;
      sessionStorage.setItem('STORE', data);
    } catch (err) {
      console.error('Error:', err);
    }
  }
});
