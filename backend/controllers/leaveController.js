/**
 * Leave Controller
 *
 * Role-based visibility:
 * - Employee: own requests only (apply, history, cancel own pending)
 * - Manager: requests from employees in departments they manage (approve/reject)
 * - HR / CEO: all requests in the company (approve/reject, view all)
 */

import Leave from '../models/leaveModel.js';

const VALID_TYPES = ['sick', 'casual', 'vacation', 'unpaid', 'maternity', 'paternity', 'other'];

/**
 * POST /api/leave
 * Employee applies for leave
 */
export const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const { id: employee_id, organization_id: company_id } = req.user;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'leave_type, start_date, and end_date are required' });
    }

    if (!VALID_TYPES.includes(leave_type)) {
      return res.status(400).json({ error: `Invalid leave_type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    const leave = await Leave.create({
      company_id,
      employee_id,
      leave_type,
      start_date,
      end_date,
      reason,
    });

    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ error: error.message || 'Error submitting leave request' });
  }
};

/**
 * GET /api/leave/my-history
 * Employee's own leave history
 */
export const getMyLeaveHistory = async (req, res) => {
  try {
    const { id: employee_id, organization_id: company_id } = req.user;
    const history = await Leave.findByEmployee(employee_id, company_id);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get leave history error:', error);
    res.status(500).json({ error: error.message || 'Error fetching leave history' });
  }
};

/**
 * GET /api/leave
 * Role-aware list:
 * - CEO / HR: all company leave requests (optional ?status= filter)
 * - Manager: only requests from departments they manage
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const { role, id: userId, organization_id: company_id } = req.user;
    const { status } = req.query;

    let requests;
    if (role === 'ceo' || role === 'hr') {
      requests = await Leave.findAllInCompany(company_id, status || null);
    } else if (role === 'manager') {
      requests = await Leave.findForManagerDepartments(userId, company_id, status || null);
    } else {
      // Employees hitting this endpoint just get their own requests
      requests = await Leave.findByEmployee(userId, company_id);
    }

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ error: error.message || 'Error fetching leave requests' });
  }
};

/**
 * PUT /api/leave/:id/approve
 */
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    const { id: reviewerId, organization_id: company_id } = req.user;

    const updated = await Leave.updateStatus(
      id,
      { status: 'approved', reviewed_by: reviewerId, review_notes },
      company_id
    );

    if (!updated) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ success: true, data: updated, message: 'Leave request approved' });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: error.message || 'Error approving leave request' });
  }
};

/**
 * PUT /api/leave/:id/reject
 */
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { review_notes } = req.body;
    const { id: reviewerId, organization_id: company_id } = req.user;

    const updated = await Leave.updateStatus(
      id,
      { status: 'rejected', reviewed_by: reviewerId, review_notes },
      company_id
    );

    if (!updated) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ success: true, data: updated, message: 'Leave request rejected' });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ error: error.message || 'Error rejecting leave request' });
  }
};

/**
 * DELETE /api/leave/:id
 * Employee cancels their own pending request
 */
export const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: employee_id, organization_id: company_id } = req.user;

    const cancelled = await Leave.cancel(id, employee_id, company_id);

    if (!cancelled) {
      return res.status(404).json({ error: 'Leave request not found, not yours, or no longer pending' });
    }

    res.json({ success: true, message: 'Leave request cancelled' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ error: error.message || 'Error cancelling leave request' });
  }
};
