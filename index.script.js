if (localStorage.getItem('events') == null) {
    localStorage.setItem('events', JSON.stringify([
        {"title": "夏休み", "start": "2025-07-19", "end": "2025-08-32" },
        { "title": "夏季授業日", "start": "2025-08-27", "end": "2025-08-29" },
        { "title": "8月実力考査", "start": "2025-8-28", "end": "2025-8-29" }
    ]));
}


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
    var calendarEl = document.getElementById('mini_calendar');

    const nowdate = new Date();
    var date = nowdate.getFullYear() + '-' + (nowdate.getMonth() + 1).toString().padStart(2, '0') + '-' + nowdate.getDate().toString().padStart(2, '0');

    localStorage.getItem
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
        events: JSON.parse(localStorage.getItem('events'))
    });
    calendar.render();
});

// mini-calendarのドラッグ移動・リサイズ機能
(function() {
    const miniCalEl = document.querySelector('.mini-calendar');
    let miniCalDrag = false;
    let miniCalResize = false;
    let miniCalDragOffsetX = 0;
    let miniCalDragOffsetY = 0;
    let miniCalResizeStartW = 0;
    let miniCalResizeStartH = 0;
    let miniCalResizeStartX = 0;
    let miniCalResizeStartY = 0;

    // リサイズハンドルを追加
    const miniCalResizeHandle = document.createElement('div');
    miniCalResizeHandle.style.position = 'absolute';
    miniCalResizeHandle.style.width = '18px';
    miniCalResizeHandle.style.height = '18px';
    miniCalResizeHandle.style.right = '0';
    miniCalResizeHandle.style.bottom = '0';
    miniCalResizeHandle.style.cursor = 'se-resize';
    miniCalResizeHandle.style.background = 'rgba(180,180,180,0.3)';
    miniCalResizeHandle.style.borderRadius = '0 0 8px 0';
    miniCalResizeHandle.style.zIndex = '100004';
    miniCalEl.appendChild(miniCalResizeHandle);

    // ドラッグ開始
    miniCalEl.addEventListener('pointerdown', function(e) {
        // リサイズハンドル上ならリサイズ
        if (e.target === miniCalResizeHandle) {
            miniCalResize = true;
            miniCalResizeStartW = miniCalEl.offsetWidth;
            miniCalResizeStartH = miniCalEl.offsetHeight;
            miniCalResizeStartX = e.clientX;
            miniCalResizeStartY = e.clientY;
            miniCalEl.setPointerCapture(e.pointerId);
            e.preventDefault();
            return;
        }
        // mini-calendar本体の上部20pxだけドラッグ可能にする
        const rect = miniCalEl.getBoundingClientRect();
        if (e.clientY - rect.top < 30) {
            miniCalDrag = true;
            miniCalDragOffsetX = e.clientX - rect.left;
            miniCalDragOffsetY = e.clientY - rect.top;
            miniCalEl.style.position = 'fixed';
            miniCalEl.style.left = rect.left + 'px';
            miniCalEl.style.top = rect.top + 'px';
            miniCalEl.setPointerCapture(e.pointerId);
            e.preventDefault();
        }
    });

    // ドラッグ・リサイズ中の移動
    miniCalEl.addEventListener('pointermove', function(e) {
        if (miniCalDrag) {
            let newLeft = e.clientX - miniCalDragOffsetX;
            let newTop = e.clientY - miniCalDragOffsetY;
            // 画面外に出ないように制限
            newLeft = Math.max(0, Math.min(window.innerWidth - miniCalEl.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - miniCalEl.offsetHeight, newTop));
            miniCalEl.style.left = newLeft + 'px';
            miniCalEl.style.top = newTop + 'px';
        }
        if (miniCalResize) {
            let newW = miniCalResizeStartW + (e.clientX - miniCalResizeStartX);
            let newH = miniCalResizeStartH + (e.clientY - miniCalResizeStartY);
            newW = Math.max(180, Math.min(window.innerWidth, newW));
            newH = Math.max(180, Math.min(window.innerHeight, newH));
            miniCalEl.style.width = newW + 'px';
            miniCalEl.style.height = newH + 'px';
        }
    });

    // ドラッグ・リサイズ終了
    miniCalEl.addEventListener('pointerup', function(e) {
        miniCalDrag = false;
        miniCalResize = false;
        miniCalEl.releasePointerCapture(e.pointerId);
    });
})();