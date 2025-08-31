package com.managementcontent.util;

import java.time.LocalDateTime;

/**
 * Utility class để tạo date range cho filtering
 */
public class DateTimeRange {
    private final LocalDateTime startDate;
    private final LocalDateTime endDate;

    private DateTimeRange(LocalDateTime startDate, LocalDateTime endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /**
     * Tạo date range cho year và optional month
     * 
     * @param year  năm
     * @param month tháng (optional, null để lấy cả năm)
     * @return DateTimeRange object
     */
    public static DateTimeRange of(int year, Integer month) {
        LocalDateTime startDate, endDate;

        if (month != null) {
            startDate = LocalDateTime.of(year, month, 1, 0, 0, 0);
            endDate = startDate.plusMonths(1).minusSeconds(1);
        } else {
            startDate = LocalDateTime.of(year, 1, 1, 0, 0, 0);
            endDate = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        }

        return new DateTimeRange(startDate, endDate);
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }
}
