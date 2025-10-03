// api/src/validators/automation-trigger.validator.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware wrapper
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
return next();
};

/**
 * Property Upload validation
 */
export const validatePropertyUpload = [
  body('propertyID')
    .notEmpty()
    .withMessage('Property ID is required'),
  body('type')
    .optional()
    .isIn(['single', 'multi'])
    .withMessage('Type must be either "single" or "multi"'),
  body('subject')
    .optional()
    .isString()
    .withMessage('Subject must be a string'),
  body('area')
    .optional()
    .isString()
    .withMessage('Area must be a string'),
  body('emailTemplate')
    .optional()
    .isString()
    .withMessage('Email template must be a string'),
  body('source')
    .optional()
    .isString()
    .withMessage('Source must be a string'),
  validate
];

/**
 * Property Update validation
 */
export const validatePropertyUpdate = [
  body('propertyID')
    .notEmpty()
    .withMessage('Property ID is required'),
  body('updateType')
    .optional()
    .isString()
    .withMessage('Update type must be a string'),
  body('changes')
    .optional()
    .isObject()
    .withMessage('Changes must be an object'),
  validate
];

/**
 * Property View validation
 */
export const validatePropertyView = [
  body('propertyID')
    .notEmpty()
    .withMessage('Property ID is required'),
  body('userId')
    .optional()
    .isString()
    .withMessage('User ID must be a string'),
  body('viewCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('View count must be a positive integer'),
  validate
];

/**
 * Campaign Status Change validation
 */
export const validateCampaignStatusChange = [
  body('campaignId')
    .notEmpty()
    .withMessage('Campaign ID is required'),
  body('fromStatus')
    .notEmpty()
    .withMessage('From status is required'),
  body('toStatus')
    .notEmpty()
    .withMessage('To status is required'),
  validate
];

/**
 * Email Tracking Event validation
 */
export const validateEmailTrackingEvent = [
  body('campaignId')
    .notEmpty()
    .withMessage('Campaign ID is required'),
  body('event')
    .notEmpty()
    .isIn(['opened', 'clicked', 'bounced', 'complained', 'delivered'])
    .withMessage('Event must be one of: opened, clicked, bounced, complained, delivered'),
  body('contactId')
    .optional()
    .isString()
    .withMessage('Contact ID must be a string'),
  validate
];