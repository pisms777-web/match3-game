function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.remove('active');
  });
  document.getElementById(tabName + '-container').classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
}

// Настройка фона
const colorPicker = document.getElementById('bg-color-picker');
const savedBg = localStorage.getItem('gameBgColor') || '#f0f0f0';
colorPicker.value = savedBg;

colorPicker.addEventListener('input', (e) => {
  const color = e.target.value;
  document.body.style.backgroundColor = color;
  localStorage.setItem('gameBgColor', color);
});