//const GraphClient = require('./graphClient');
import { GraphClient } from "./graphClient";

export class GraphHelper {

    /**
     * Gets the newest meeting attendance record for the passed meeting Id.
     * @param {string} meetingId Id of the meeting
     * @returns Meeting attendance record if any, otherwise return null.
     */
    static async getNewestMeetingAttendanceRecordsAsync(meetingId, userId) {
        try {
            var graphClient = GraphClient.getGraphClient();

            var attendanceReportUrl = `/users/${ userId }/onlineMeetings/${ meetingId }/attendanceReports`;
            var attendanceReports = await graphClient.api(attendanceReportUrl).get();

            if (attendanceReports.value.length > 0) {
                var currentAttendanceReport = attendanceReports.value[0];

                const meetingStartDate: Date = new Date(currentAttendanceReport.meetingStartDateTime);
                const meetingEndDate: Date = new Date(currentAttendanceReport.meetingEndDateTime);
                var meetingTimeSpan = Math.trunc((meetingEndDate.getTime() - meetingStartDate.getTime()) / 1000);

                var meetingAttendanceReport = {
                    attendaceReportId: currentAttendanceReport.id,
                    meetingDuration: this.getDurationFormattedString(meetingTimeSpan),
                    meetingStartAndEndTime: `{{TIME(${ currentAttendanceReport.meetingStartDateTime.split('.')[0] }Z)}} - {{TIME(${currentAttendanceReport.meetingEndDateTime.split('.')[0]}Z)}}`,
                    participantCount: currentAttendanceReport.totalParticipantCount,
                    participantsInfo: [],
                };

                var attendanceRecords = await graphClient.api(`/users/${userId}/onlineMeetings/${meetingId}/attendanceReports/${currentAttendanceReport.id}/attendanceRecords`)
                    .get();

                attendanceRecords.value.forEach((attendanceRecord) => {
                    meetingAttendanceReport.participantsInfo.push(
                        {
                            id: attendanceRecord.id,
                            displayName: attendanceRecord.identity.displayName,
                            duration: this.getDurationFormattedString(attendanceRecord.totalAttendanceInSeconds),
                            firstJoinTime: '{{TIME(' + attendanceRecord.attendanceIntervals[0].joinDateTime.split('.')[0] + 'Z)}}',
                            lastLeaveTime: '{{TIME(' + attendanceRecord.attendanceIntervals[attendanceRecord.attendanceIntervals.length - 1].leaveDateTime.split('.')[0] + 'Z)}}',
                            role: attendanceRecord.role
                        }
                    );
                });

                const onlineMeeting = {
                    allowMeetingChat: 'disabled'
                };

                var updateMeeting = await graphClient.api(`/users/${userId}/onlineMeetings/${meetingId}`).update(onlineMeeting);

                return meetingAttendanceReport;
            }

            return null;
        }
        catch (ex) {
            console.log(ex);
            return null;
        }
    }

    /**
     * Converts the time in seconds to formatted string in {hour}h {minute}m {second}s format.
     * @param {int} timeInSeconds Time in seconds
     * @returns String formatted in {hour}h {minute}m {second}s.
     */
    static getDurationFormattedString(timeInSeconds) {
        var durationString = "";

        if (Math.trunc(timeInSeconds / 60) > 0) {
            var minute = 0;
            if (Math.trunc(timeInSeconds / 60) >= 60) {
                minute = Math.trunc(timeInSeconds / 60);
                durationString += Math.trunc(minute / 60) + "h ";
            }

            if (minute > 0) {
                durationString += (minute % 60) + "m ";
            }
            else {
                durationString += Math.trunc(timeInSeconds / 60) + "m ";
            }
        }

        if (timeInSeconds % 60 > 0) {
            durationString += (timeInSeconds % 60) + "s ";
        }

        return durationString;
    }

}