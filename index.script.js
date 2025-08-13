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

// 設定ダイアログのドラッグ機能
const dialog = document.getElementById('$main_settings_dialog');
let drag = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

dialog.addEventListener('pointerdown', function(event) {
    drag = true;
    // dialogの現在位置を取得
    const rect = dialog.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    // fixedでleft/topを明示的にセット
    dialog.style.position = 'fixed';
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    dialog.setPointerCapture(event.pointerId);
});

dialog.addEventListener('pointermove', function(event) {
    if (!drag) return;
    // 新しい位置を計算
    let newLeft = event.clientX - dragOffsetX;
    let newTop = event.clientY - dragOffsetY;
    dialog.style.left = newLeft + 'px';
    dialog.style.top = newTop + 'px';
    // ↓コメントアウトはずしたら、画面外へ行かないようにできる
    /*
    newLeft = Math.max(0, Math.min(window.innerWidth - dialog.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - dialog.offsetHeight, newTop));
    */
});

dialog.addEventListener('pointerup', function(event) {
    drag = false;
    dialog.releasePointerCapture(event.pointerId);
});

// 左上のミニカレンダー
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    const nowdate = new Date();
    var date = nowdate.getFullYear() + '-' + (nowdate.getMonth() + 1).toString().padStart(2, '0') + '-' + nowdate.getDate().toString().padStart(2, '0');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        dayCellContent: function (arg) {
            return arg.dayNumberText.replace('日', '');
        },
        locale: 'ja',
        initialView: 'dayGridMonth',
        initialDate: date,
        editable: true,
        selectable: true,
        dayMaxEvents: true, // allow "more" link when too many events
        // multiMonthMaxColumns: 1, // guarantee single column
        // showNonCurrentDates: true,
        // fixedWeekCount: false,
        businessHours: true,
        // weekends: false,
        events: []
    });
    calendar.render();
});