import React from 'react';
import styled from 'styled-components';

const CustomButton = ({ onClick, children }) => {
  return (
    <StyledWrapper>
      <button className="button" onClick={onClick}>
        <div className="text">{children || "Reseñas"}</div>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .button {
    background: var(--color-back);
    border-radius: 0.5em;
    box-shadow:
      inset 0px -6px 18px -6px rgba(3, 15, 20, 0),
      inset rgba(54, 69, 75, 1) -1px -1px 6px 0px,
      inset 12px 0px 12px -6px rgba(3, 15, 20, 0),
      inset -12px 0px 12px -6px rgba(3, 15, 20, 0),
      rgba(54, 69, 75, 1) -1px -1px 6px 0px;
    border: solid 2px #030f14;
    cursor: pointer;
    font-size: 14px;
    padding: 0.5em 1em;
    outline: none;
    transition: all 0.3s;
    user-select: none;
    width: 100%;
  }

  .button:hover {
    box-shadow:
      inset 0px -6px 18px -6px rgba(3, 15, 20, 1),
      inset 0px 6px 18px -6px rgba(3, 15, 20, 1),
      inset 12px 0px 12px -6px rgba(3, 15, 20, 0),
      inset -12px 0px 12px -6px rgba(3, 15, 20, 0),
      -1px -1px 6px 0px rgba(54, 69, 75, 1);
  }

  .button:active {
    box-shadow:
      inset 0px -12px 12px -6px rgba(3, 15, 20, 1),
      inset 0px 12px 12px -6px rgba(3, 15, 20, 1),
      inset 12px 0px 12px -6px rgba(3, 15, 20, 1),
      inset -12px 0px 12px -6px rgba(3, 15, 20, 1),
      -1px -1px 6px 0px rgba(54, 69, 75, 1);
  }

  .text {
    color: #ffffffff;
    font-weight: 600;
    margin: 0.5em auto;
    transition: all 0.3s;
    width: fit-content;
  }

  .button:hover .text {
    transform: scale(0.9);
  }

  .button:active .text {
    transform: scale(0.8);
  }
`;

export default CustomButton;