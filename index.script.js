if (localStorage.getItem('events') == null) {
    localStorage.setItem('events', JSON.stringify([
        {"title":"夏季授業日","start":"2025-08-27T08:20","end":"2025-08-29T17:00"},
        {"title":"実力考査","start":"2025-08-28T08:20","end":"2025-08-29T17:00"}
    ]));
}

// イベントデータのend日付を+1日する関数
function adjustEndDateForFullCalendar(event) {
    if (!event.end) return event;
    // endが日付のみ（時刻なし）の場合のみ+1日
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(event.end)) {
        const endDate = new Date(event.end);
        endDate.setDate(endDate.getDate() + 1);
        return { ...event, end: endDate.toISOString().slice(0, 10) };
    }
    // datetimeの場合はそのまま
    return event;
}

// FullCalendarから取得したイベントを保存する際にendを-1日戻す
function adjustEndDateForStorage(event) {
    if (!event.end) return event;
    // endが日付のみ（時刻なし）の場合のみ-1日
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(event.end)) {
        const endDate = new Date(event.end);
        endDate.setDate(endDate.getDate() - 1);
        return { ...event, end: endDate.toISOString().slice(0, 10) };
    }
    // datetimeの場合はそのまま
    return event;
}

// 既存データのend日付を+1日補正（初回のみ）
(function fixStoredEvents() {
    let events = JSON.parse(localStorage.getItem('events') || '[]');
    let changed = false;
    events = events.map(ev => {
        if (ev.end && /^\d{4}-\d{1,2}-\d{1,2}$/.test(ev.end)) {
            const start = new Date(ev.start);
            const end = new Date(ev.end);
            // end > start かつ endとstartが同じでない場合のみ補正
            if (end > start) {
                const endPlus1 = new Date(end);
                endPlus1.setDate(endPlus1.getDate() + 1);
                changed = true;
                return { ...ev, end: endPlus1.toISOString().slice(0, 10) };
            }
        }
        return ev;
    });
    if (changed) {
        localStorage.setItem('events', JSON.stringify(events));
    }
})();

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
// document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('mini_calendar');

    // ↓ここでnowdateとdateを定義
    const nowdate = new Date();
    var date = nowdate.getFullYear() + '-' + (nowdate.getMonth() + 1).toString().padStart(2, '0') + '-' + nowdate.getDate().toString().padStart(2, '0');

    // ローカルストレージからイベントを読み込み、FullCalendar用に変換
    let events = [];
    try {
        events = JSON.parse(localStorage.getItem('events') || '[]').map(parseEventForCalendar);
    } catch (e) {
        events = [];
    }

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

                    // 入力フィールドの初期化（現在時刻をJSTで設定）
                    const now = new Date();
                    const localDateTime = toDatetimeLocalStringJST(now);
                    titleEl.value = '';
                    startEl.value = localDateTime;
                    endEl.value = localDateTime;

                    saveBtn.onclick = () => {
                        if (!titleEl.value || !startEl.value) return;
                        let startVal = startEl.value;
                        let endVal = endEl.value || startVal;

                        // 終日イベント（時刻が00:00）ならYYYY-MM-DDで保存
                        const isAllDay = startVal.length === 10 && endVal.length === 10;
                        let eventObj;
                        if (isAllDay) {
                            // endは+1日して渡す
                            const endDate = new Date(endVal);
                            endDate.setDate(endDate.getDate() + 1);
                            eventObj = {
                                title: titleEl.value,
                                start: startVal,
                                end: endDate.toISOString().slice(0, 10),
                                allDay: true
                            };
                        } else {
                            eventObj = {
                                title: titleEl.value,
                                start: fromDatetimeLocalStringJST(startVal),
                                end: fromDatetimeLocalStringJST(endVal)
                            };
                        }
                        calendar.addEvent(eventObj);
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
        dayMaxEvents: true,
        // multiMonthMaxColumns: 1,
        // showNonCurrentDates: true,
        // fixedWeekCount: false,
        businessHours: true,
        // weekends: false,
        events: events,
        eventAdd: function() {
            // イベント追加時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(
                calendar.getEvents().map(eventForStorage)
            ));
        },
        eventChange: function() {
            // イベント編集時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(
                calendar.getEvents().map(eventForStorage)
            ));
        },
        eventRemove: function() {
            // イベント削除時にlocalStorageへ保存
            localStorage.setItem('events', JSON.stringify(
                calendar.getEvents().map(eventForStorage)
            ));
        },
        eventClick: function(info) {
            const dialog = document.getElementById('event_dialog');
            const titleEl = document.getElementById('event_title');
            const startEl = document.getElementById('event_start');
            const endEl = document.getElementById('event_end');
            const saveBtn = document.getElementById('event_save');
            const deleteBtn = document.getElementById('event_delete');

            titleEl.value = info.event.title;

            // 終日イベントかどうか
            if (info.event.allDay) {
                // FullCalendarはend=翌日なので-1日して表示
                const startStr = info.event.startStr.slice(0, 10);
                let endStr = info.event.endStr ? info.event.endStr.slice(0, 10) : startStr;
                if (info.event.end) {
                    const endDate = new Date(info.event.end);
                    endDate.setDate(endDate.getDate() - 1);
                    endStr = toDatetimeLocalStringJST(endDate).slice(0, 10);
                }
                startEl.value = startStr + 'T00:00';
                endEl.value = endStr + 'T00:00';
            } else {
                startEl.value = toDatetimeLocalStringJST(info.event.start);
                endEl.value = info.event.end ? toDatetimeLocalStringJST(info.event.end) : startEl.value;
            }

            saveBtn.onclick = () => {
                if (!titleEl.value) return;
                info.event.setProp('title', titleEl.value);

                const startVal = startEl.value;
                const endVal = endEl.value || startVal;
                const isAllDay = startVal.endsWith('T00:00') && endVal.endsWith('T00:00');

                if (isAllDay) {
                    // 終日イベントとして更新
                    const startDate = startVal.slice(0, 10);
                    const endDate = new Date(endVal.slice(0, 10));
                    endDate.setDate(endDate.getDate() + 1); // FullCalendar用に+1日
                    info.event.setAllDay(true);
                    info.event.setStart(startDate);
                    info.event.setEnd(endDate.toISOString().slice(0, 10));
                } else {
                    // 時間付きイベント
                    info.event.setAllDay(false);
                    info.event.setStart(fromDatetimeLocalStringJST(startVal));
                    info.event.setEnd(fromDatetimeLocalStringJST(endVal));
                }
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
// });

function updateCalendarSize() {
        calendar.updateSize();
};


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
    dragHandle.style.height = '20px';
    dragHandle.style.backgroundColor = 'rgba(180,180,180,0.1)';
    dragHandle.style.cursor = 'move';
    dragHandle.style.borderRadius = '8px 8px 0 0';
    dragHandle.style.zIndex = '100003';
    dragHandle.style.display = 'flex';
    dragHandle.style.justifyContent = 'flex-end';
    dragHandle.style.alignItems = 'center';

    // 全画面ボタンを追加
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'mini-calendar-fullscreen-btn';
    fullscreenBtn.title = '全画面表示';
    fullscreenBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M4 4h7V2H2v9h2V4zm13 0v2h3v7h2V2h-7v2zm3 13h-3v2h7v-7h-2v5zm-13-3H2v7h7v-2H4v-5z"/>
        </svg>
    `;
    dragHandle.appendChild(fullscreenBtn);

    // 全画面切り替え処理
    let isFullscreen = false;
    let prevStyle = {};
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isFullscreen) {
            // 保存
            prevStyle = {
                left: miniCalEl.style.left,
                top: miniCalEl.style.top,
                width: miniCalEl.style.width,
                height: miniCalEl.style.height,
                position: miniCalEl.style.position,
                zIndex: miniCalEl.style.zIndex
            };
            miniCalEl.style.position = 'fixed';
            miniCalEl.style.left = '0';
            miniCalEl.style.top = '0';
            miniCalEl.style.width = '100vw';
            miniCalEl.style.height = '100vh';
            miniCalEl.style.zIndex = '100010';
            isFullscreen = true;
            fullscreenBtn.title = '元に戻す';
            fullscreenBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M15 3h6v6h-2V5h-4V3zm-6 0v2H5v4H3V3h6zm6 18v-2h4v-4h2v6h-6zm-6 0H3v-6h2v4h4v2z"/>
                </svg>
            `;
            updateCalendarSize();
        } else {
            miniCalEl.style.left = prevStyle.left;
            miniCalEl.style.top = prevStyle.top;
            miniCalEl.style.width = prevStyle.width;
            miniCalEl.style.height = prevStyle.height;
            miniCalEl.style.position = prevStyle.position;
            miniCalEl.style.zIndex = prevStyle.zIndex;
            isFullscreen = false;
            fullscreenBtn.title = '全画面表示';
            fullscreenBtn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M4 4h7V2H2v9h2V4zm13 0v2h3v7h2V2h-7v2zm3 13h-3v2h7v-7h-2v5zm-13-3H2v7h7v-2H4v-5z"/>
                </svg>
            `;
            updateCalendarSize();
        }
    });

    miniCalEl.insertBefore(dragHandle, miniCalEl.firstChild);

    // カレンダー本体にパディングを追加
    const calendarEl = document.getElementById('mini_calendar');
    calendarEl.style.paddingTop = '20px';  // ドラッグハンドルの高さと同じ分のパディング

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
            // 画面外制限を削除
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

// イベントデータをFullCalendar用に変換
function parseEventForCalendar(ev) {
    // 終日イベント（YYYY-MM-DD形式）の場合
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(ev.start)) {
        // endもYYYY-MM-DDなら+1日して渡す
        let end = ev.end;
        if (end && /^\d{4}-\d{1,2}-\d{1,2}$/.test(end)) {
            const endDate = new Date(end);
            endDate.setDate(endDate.getDate() + 1);
            end = endDate.toISOString().slice(0, 10);
        }
        return {
            title: ev.title,
            start: ev.start,
            end: end,
            allDay: true
        };
    }
    // 時間付きイベント
    return {
        title: ev.title,
        start: ev.start,
        end: ev.end
    };
}

// FullCalendarのイベントをローカルストレージ用に変換
function eventForStorage(ev) {
    // allDayならYYYY-MM-DD形式で保存
    if (ev.allDay) {
        // endは-1日して保存
        let end = ev.end;
        if (end) {
            const endDate = new Date(end);
            endDate.setDate(endDate.getDate() - 1);
            end = endDate.toISOString().slice(0, 10);
        }
        return {
            title: ev.title,
            start: ev.startStr.slice(0, 10),
            end: end
        };
    }
    // 時間付きイベントはISO文字列（JST）で保存
    return {
        title: ev.title,
        start: toISOStringJST(ev.start),
        end: ev.end ? toISOStringJST(ev.end) : undefined
    };
}

// JSTでISO8601文字列（YYYY-MM-DDTHH:mm）を返す
function toISOStringJST(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
}

// input[type=datetime-local]用のJST文字列
function toDatetimeLocalStringJST(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
}

// input[type=datetime-local]の値をJSTのDateに変換
function fromDatetimeLocalStringJST(str) {
    if (!str) return null;
    const [date, time] = str.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
}

updateCalendarSize();

// お気に入り
if (localStorage.getItem('favorites') == null) {
    localStorage.setItem('favorites', JSON.stringify([
        {"title":"Google", "url":"https://www.google.com", "icon":"https://www.google.com/favicon.ico"}
    ]));
    /*
    ↓こんな感じで
    {"title":"お気に入りのタイトル", "url":"https://example.com", "icon":"https://example.com/icon.png"}
    */
}
// お気に入りの表示
var favorites = JSON.parse(localStorage.getItem('favorites'));
var favoritesCount = favorites.length + 1;
for(let i = 0; i < favoritesCount; i++) {
    const fav = favorites[i];
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = fav.url;
    a.target = '_blank';
    a.className = 'favorite-item';
    if (fav.icon) {
        const img = document.createElement('img');
        img.src = fav.icon;
        img.alt = fav.title;
        li.appendChild(img);
    }
    const span = document.createElement('span');
    span.textContent = fav.title;
    li.appendChild(span);
    a.appendChild(li);
    $favorite_ul.appendChild(a);
}