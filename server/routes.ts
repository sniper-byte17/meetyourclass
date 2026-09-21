import { Router } from 'express';
import { storage } from './storage';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MeetFutureClass Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Schools endpoints
apiRouter.get('/schools', (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const state = req.query.state as string | undefined;
    const schools = storage.getSchools(search, state);
    res.json({ success: true, count: schools.length, data: schools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch schools' });
  }
});

apiRouter.get('/schools/:id', (req, res) => {
  try {
    const school = storage.getSchoolById(req.params.id);
    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }
    res.json({ success: true, data: school });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch school' });
  }
});

apiRouter.post('/schools/request', (req, res) => {
  try {
    const { schoolName, cityState, igHandle, contactEmail } = req.body;
    if (!schoolName || !schoolName.trim()) {
      return res.status(400).json({ success: false, error: 'School name is required' });
    }
    const request = storage.requestSchool({ schoolName, cityState, igHandle, contactEmail });
    res.status(201).json({ success: true, message: 'School requested successfully', data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to request school' });
  }
});

// Submissions endpoints
apiRouter.get('/submissions', (req, res) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const status = req.query.status as string | undefined;
    const submissions = storage.getSubmissions(schoolId, status);
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch submissions' });
  }
});

apiRouter.post('/submissions', (req, res) => {
  try {
    const submissionData = req.body;
    if (!submissionData.name || !submissionData.name.trim()) {
      return res.status(400).json({ success: false, error: 'Student name is required' });
    }
    if (!submissionData.school || !submissionData.school.id) {
      return res.status(400).json({ success: false, error: 'Valid school is required' });
    }

    const created = storage.createSubmission(submissionData);
    res.status(201).json({
      success: true,
      message: 'Student post submitted to campus queue successfully',
      data: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to submit post' });
  }
});

apiRouter.patch('/submissions/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['queued', 'approved', 'posted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid submission status' });
    }
    const updated = storage.updateSubmissionStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true, message: `Submission status updated to ${status}`, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update submission' });
  }
});

apiRouter.patch('/submissions/:id/payment', (req, res) => {
  try {
    const { paymentStatus, verifiedBy } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ success: false, error: 'paymentStatus is required' });
    }
    const updated = storage.updateSubmissionPayment(req.params.id, paymentStatus, verifiedBy);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true, message: `Submission payment status updated to ${paymentStatus}`, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update submission payment' });
  }
});

apiRouter.delete('/submissions/:id', (req, res) => {
  try {
    const deleted = storage.deleteSubmission(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }
    res.json({ success: true, message: 'Submission deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete submission' });
  }
});

// Profiles (Networking) endpoints
apiRouter.get('/profiles', (req, res) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const search = req.query.search as string | undefined;
    const profiles = storage.getProfiles(schoolId, search);
    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch profiles' });
  }
});

apiRouter.post('/profiles', (req, res) => {
  try {
    const profileData = req.body;
    if (!profileData.name || !profileData.name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const created = storage.createProfile(profileData);
    res.status(201).json({ success: true, message: 'Profile created successfully', data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create profile' });
  }
});

// Payment Verification endpoints
apiRouter.post('/payments/verify', (req, res) => {
  try {
    const { submissionId, studentName, studentHandle, schoolId, tier, amount, paymentMode, payerHandleOrMemo } = req.body;

    if (!submissionId || !studentName) {
      return res.status(400).json({ success: false, error: 'Missing submission verification details' });
    }

    const verification = storage.verifyPayment({
      submissionId,
      studentName,
      studentHandle: studentHandle || '',
      schoolId: schoolId || 'emory',
      tier: tier || 'fast',
      amount: amount || (tier === 'vip' ? 19 : tier === 'fast' ? 9 : 4),
      paymentMode: paymentMode || 'cashapp',
      payerHandleOrMemo: payerHandleOrMemo || '',
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and priority queue locked in',
      data: verification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Payment verification failed' });
  }
});

// Admin Metrics endpoints
apiRouter.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = (username || '').toString().trim().toLowerCase();
    const cleanPass = (password || '').toString().trim();

    if ((cleanUser === 'mato' || cleanUser === 'pato') && cleanPass === '#NewChapter') {
      return res.json({
        success: true,
        user: cleanUser,
        role: 'super_admin',
        message: 'Admin authenticated successfully',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please verify your username and password.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Login error' });
  }
});

apiRouter.get('/admin/metrics', (req, res) => {
  try {
    const metrics = storage.getAdminMetrics();
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch admin metrics' });
  }
});

// Cross-origin image proxy for canvas manipulations
apiRouter.get('/proxy-image', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url query parameter');
    }
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch remote image');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).send(err?.message || 'Proxy error');
  }
});
