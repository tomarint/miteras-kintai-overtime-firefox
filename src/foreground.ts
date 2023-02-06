(function () {
  'use strict';
  function isNumeric(c: string): boolean {
    return '0' <= c && c <= '9';
  }
  function parse_hhmm(s: string): number {
    if (s.length != 5 || s[2] != ':') {
      return 0;
    }
    if (!isNumeric(s[0]) || !isNumeric(s[1]) || !isNumeric(s[3]) || !isNumeric(s[4])) {
      return 0;
    }
    const hour = parseInt(s[0]) * 10 + parseInt(s[1]);
    const min = parseInt(s[3]) * 10 + parseInt(s[4]);
    return hour * 60 + min;
  }
  function hhmm(minute: number): string {
    let sign = '';
    if (minute < 0) {
      minute = -minute;
      sign = '-';
    }
    const m = minute % 60;
    const h = (minute - m) / 60;
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
  function getColumnsOfTable(): { [name: string]: number } | null {
    const head_tr = document.querySelector("#monthly-view-attendance-content > table > tbody > tr");
    if (head_tr == null) {
      return null;
    }
    const head_ths = head_tr.querySelectorAll("th");
    if (head_ths == null) {
      return null;
    }
    const ret: { [name: string]: number } = {};
    head_ths.forEach((th, i) => {
      const overtime = th.querySelector("div > span");
      if (overtime != null) {
        let column_name = overtime.textContent;
        if (column_name != null) {
          ret[column_name] = i;
        }
      }
    });
    return ret;
  }
  // Show cumulative overtime hours
  function showCumulativeOvertimeHours() {
    // console.log("location.href:", location.href);
    if (!location.href.endsWith("/work-condition")) {
      return;
    }
    let columns_of_table = getColumnsOfTable();
    if (columns_of_table == null) {
      return;
    }
    const overtime_column = columns_of_table["残業"];
    const worktype_column = columns_of_table["種別"];
    const worktime_column = columns_of_table["勤務合計"];
    if ((overtime_column != null)
    &&  (worktype_column != null)
    &&  (worktime_column != null)) {
      // console.log("columns_of_table:", columns_of_table);
    } else {
      console.log("Unknown overtime format.")
      console.log("columns_of_table:", columns_of_table);
      return;
    }

    //
    // Add the header of the table
    //
    const head_tr = document.querySelector("#monthly-view-attendance-content > table > tbody > tr");
    if (head_tr == null) {
      return;
    }
    const head_th = head_tr.querySelector(`th:nth-child(${overtime_column + 1})`);
    if (head_th == null) {
      return;
    }
    //
    // Add a new column of the head of the table
    //
    let new_th = head_th.cloneNode(true) as Element;
    head_tr.appendChild(new_th);
    const new_overtime = new_th.querySelector("div > span");
    if (new_overtime == null) {
      return;
    }
    new_overtime.textContent = "累計残業";

    //
    // Add a new column of the body of the table
    //
    const tbody = document.querySelector("#attendance-table-body > table > tbody");
    if (tbody == null) {
      return;
    }
    const body_trs = tbody.querySelectorAll("tr");
    if (body_trs == null) {
      return;
    }


    //
    // Add a new column of the body of the table
    //
    let cum_min = 0;
    body_trs.forEach(body_tr => {
      const body_tds = body_tr.querySelectorAll("td");
      if (body_tds == null) {
        return null;
      }
      // for (let i = 0; i < body_tds.length; i++) {
      //   console.log(i, body_tds[i]);
      // }
      const new_td = document.createElement("td");
      new_td.className = "table01__cell--time";

      // 種別
      let text = body_tds[worktype_column].querySelector("div")?.textContent;
      if (text == null) {
        console.log("Unknown worktype format.");
        return;
      }
      const worktype = text.trim();

      // 勤務合計
      text = body_tds[worktime_column]?.textContent;
      if (text == null) {
        console.log("Unknown worktime format.");
        return;
      }
      const worktime_min = parse_hhmm(text);
      let overtime_min = 0;
      if (worktime_min === 0) {
        if (worktype === "全休(代休)") {
          overtime_min = -8 * 60;
        }
      }
      else {
        if (worktype === "所定休日出勤") {
          overtime_min = worktime_min;
        } else if (worktype === "午前半休(AM：年次有給休暇)") {
          overtime_min = worktime_min - 4 * 60;
        } else if (worktype === "午後半休(PM：年次有給休暇)") {
          overtime_min = worktime_min - 4 * 60;
        } else {
          overtime_min = worktime_min - 8 * 60;
        }
      }

      if (worktime_min === 0 && overtime_min === 0) {
        new_td.innerText = "-";
      } else {
        cum_min += overtime_min;
        const cum_str = hhmm(cum_min);
        new_td.innerText = cum_str;
      }
      // console.log("worktype:", worktype, "worktime_min:", worktime_min, "overtime_min:", overtime_min, "cum_min:", cum_min)
      body_tr.appendChild(new_td);
    });
  }
  showCumulativeOvertimeHours();
})();
