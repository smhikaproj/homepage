setInterval(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const daySycle = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    if (hour < 10) hour = '0' + hour;
    if (minutes < 10) minutes = '0' + minutes;
    if (seconds < 10) seconds = '0' + seconds;
    document.querySelector('.day').textContent = `${year}年${month}月${day}日 (${daySycle})`;
    document.querySelector('.time').textContent = `${hour}:${minutes}:${seconds}`;
}, 50); 