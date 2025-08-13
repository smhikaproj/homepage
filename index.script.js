if (localStorage.getItem('events') == null) {
    localStorage.setItem('events', JSON.stringify([
        { "title": "夏休み", "start": "2025-07-19", "end": "2025-08-31" },
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

    var calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'prev,next today addEventButton',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
        },
        customButtons: {
            addEventButton: {
                text: '＋',
                click: function() {
                    const dialog = document.getElementById('add_event_dialog');
                    const titleEl = document.getElementById('new_event_title');
                    const startEl = document.getElementById('new_event_start');
                    const endEl = document.getElementById('new_event_end');
                    const saveBtn = document.getElementById('new_event_save');

                    // 入力フィールドの初期化（現在時刻を設定）
                    const now = new Date();
                    const localDateTime = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm形式に
                    titleEl.value = '';
                    startEl.value = localDateTime;
                    endEl.value = localDateTime;

                    saveBtn.onclick = () => {
                        if (!titleEl.value || !startEl.value) return;
                        calendar.addEvent({
                            title: titleEl.value,
                            start: startEl.value,
                            end: endEl.value || startEl.value
                        });
                        dialog.close();
                    };

                    dialog.showModal();
                }
            }
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
        events: JSON.parse(localStorage.getItem('events')),
        eventAdd: function() {
            // イベント追加時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(calendar.getEvents().map(ev => ({
                title: ev.title,
                start: ev.startStr,
                end: ev.endStr
            }))));
        },
        eventChange: function() {
            // イベント編集時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(calendar.getEvents().map(ev => ({
                title: ev.title,
                start: ev.startStr,
                end: ev.endStr
            }))));
        },
        eventRemove: function() {
            // イベント削除時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(calendar.getEvents().map(ev => ({
                title: ev.title,
                start: ev.startStr,
                end: ev.endStr
            }))));
        },
        eventClick: function(info) {
            const dialog = document.getElementById('event_dialog');
            const titleEl = document.getElementById('event_title');
            const startEl = document.getElementById('event_start');
            const endEl = document.getElementById('event_end');
            const saveBtn = document.getElementById('event_save');
            const deleteBtn = document.getElementById('event_delete');

            titleEl.value = info.event.title;  // h3からinputに変更
            startEl.value = info.event.start.toISOString().slice(0, 16);
            endEl.value = info.event.end ? info.event.end.toISOString().slice(0, 16) : startEl.value;

            saveBtn.onclick = () => {
                if (!titleEl.value) return;  // タイトルが空の場合は保存しない
                info.event.setProp('title', titleEl.value);  // タイトルを更新
                info.event.setStart(startEl.value);
                info.event.setEnd(endEl.value || startEl.value);
                dialog.close();
            };

            deleteBtn.onclick = () => {
                if (confirm('このイベントを削除してもよろしいですか？')) {
                    info.event.remove();
                    dialog.close();
                }
            };

            dialog.showModal();
        },
    });
    calendar.render();
    calendar.updateSize();

    // FullCalendarのカスタムボタンとタイトルのサイズを調整
    const style = document.createElement('style');
    style.textContent = `
        .mini-calendar .fc-toolbar-title {
            font-size: 1em !important;
        }
        .mini-calendar .fc-addEventButton-button {
            font-size: 0.9em !important;
            padding: 2px 8px !important;
            height: 1.6em !important;
            min-width: 1.6em !important;
            line-height: 1.2em !important;
        }
        .mini-calendar .fc-button {
            font-size: 0.9em !important;
            padding: 2px 6px !important;
        }
    `;
    document.head.appendChild(style);
});

// mini-calendarのドラッグ移動・リサイズ機能
(function() {
    const miniCalEl = document.querySelector('.mini-calendar');

    // ドラッグハンドルを追加
    const dragHandle = document.createElement('div');
    dragHandle.className = 'mini-calendar-drag-handle';
    dragHandle.style.position = 'absolute';
    dragHandle.style.top = '0';
    dragHandle.style.left = '0';
    dragHandle.style.right = '0';
    dragHandle.style.height = '10px';  // 高さを10pxに調整
    dragHandle.style.backgroundColor = 'rgba(180,180,180,0.1)';
    dragHandle.style.cursor = 'move';
    dragHandle.style.borderRadius = '8px 8px 0 0';
    dragHandle.style.zIndex = '100003';
    miniCalEl.insertBefore(dragHandle, miniCalEl.firstChild);

    // カレンダー本体にパディングを追加
    const calendarEl = document.getElementById('mini_calendar');
    calendarEl.style.paddingTop = '10px';  // ドラッグハンドルの高さと同じ分のパディング

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
        // ツールバーやボタンのクリックは無視
        if (e.target.closest('.fc-toolbar') || e.target.closest('.fc-button')) {
            return;
        }

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

        // ドラッグハンドル上なら移動開始
        if (e.target === dragHandle) {
            miniCalDrag = true;
            miniCalDragOffsetX = e.clientX - miniCalEl.offsetLeft;
            miniCalDragOffsetY = e.clientY - miniCalEl.offsetTop;
            miniCalEl.style.position = 'fixed';
            miniCalEl.style.left = miniCalEl.offsetLeft + 'px';
            miniCalEl.style.top = miniCalEl.offsetTop + 'px';
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